import { readFile } from 'node:fs/promises';

try {
  process.loadEnvFile?.();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const argument = process.argv[2];
if (argument === '--help' || argument === '-h') {
  console.log('npm run seed -- https://<project-id>.mockapi.io/api/v1');
  console.log(
    'Or set EXPO_PUBLIC_MOCKAPI_BASE_URL in .env, then run npm run seed.',
  );
  console.log(
    'Creates sample records on MockAPI. Never deletes existing data. Re-runs skip matching records.',
  );
  process.exit(0);
}

async function main() {
  const baseUrl = (argument || process.env.EXPO_PUBLIC_MOCKAPI_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(
      'Provide your real MockAPI Base URL. Run npm run seed -- --help for usage.',
    );
  }
  if (
    url.protocol !== 'https:' ||
    !url.hostname.endsWith('.mockapi.io') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /YOUR_PROJECT_ID/i.test(baseUrl) ||
    /\/(courses|categories)(\/|$)/i.test(url.pathname)
  ) {
    throw new Error(
      'Use the HTTPS Base URL of your MockAPI project, without /courses or /categories.',
    );
  }
  async function request(resource, body) {
    const response = await fetch(`${baseUrl}/${resource}`, {
      method: body ? 'POST' : 'GET',
      signal: AbortSignal.timeout(15000),
      headers: body
        ? { 'Content-Type': 'application/json', Accept: 'application/json' }
        : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok)
      throw new Error(
        `${resource}: HTTP ${response.status}. Create the categories and courses resources first.`,
      );
    return response.json();
  }
  const data = JSON.parse(
    await readFile(
      new URL('../data/mockapi-seed.json', import.meta.url),
      'utf8',
    ),
  );
  // Read both resources before writing anything: a missing endpoint should fail early.
  const [categories, courses] = await Promise.all([
    request('categories'),
    request('courses'),
  ]);
  if (!Array.isArray(categories) || !Array.isArray(courses))
    throw new Error('Both resources must return JSON arrays.');
  const ids = new Map();
  for (const { key, ...input } of data.categories) {
    let category = categories.find((item) => item.name === input.name);
    if (!category) {
      category = await request('categories', input);
      categories.push(category);
      console.log(`Created category: ${category.name}`);
    }
    if (!category?.id) throw new Error(`Missing category id: ${input.name}`);
    ids.set(key, String(category.id));
  }
  for (const [index, { categoryKey, ...input }] of data.courses.entries()) {
    const categoryId = ids.get(categoryKey);
    if (!categoryId) throw new Error(`Unknown category key: ${categoryKey}`);
    if (
      courses.some(
        (item) =>
          item.title === input.title && String(item.categoryId) === categoryId,
      )
    ) {
      console.log(`Skipped existing course: ${input.title}`);
      continue;
    }
    const course = await request('courses', {
      ...input,
      categoryId,
      thumbnail: data.thumbnails[index % data.thumbnails.length],
      trailerUrl: data.trailerUrl,
      createdAt: new Date().toISOString(),
    });
    if (!course?.id) throw new Error(`Missing course id: ${input.title}`);
    courses.push(course);
    console.log(`Created course: ${input.title}`);
  }
  console.log(
    `Done: ${categories.length} categories, ${courses.length} courses. Open the app and refresh.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
