import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

// Test the actual TypeScript domain/API modules without adding a mobile test runner.
function loadSource(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  new Function('exports', 'require', 'module', compiled.outputText)(
    module.exports,
    createRequire(import.meta.url),
    module,
  );
  return module.exports;
}
const {
  normalizeBaseUrl,
  validateCourse,
  toCourseInput,
  searchCourses,
  formatPrice,
} = loadSource('../src/utils/courses.ts');
const { createApi, parseCourse, parseCategory, ApiError } = loadSource(
  '../src/services/api.ts',
);
const categories = [{ id: '8', name: 'Mobile', description: '' }];
const values = {
  title: ' React Native ',
  description: ' Nội dung ',
  instructor: ' An ',
  categoryId: '8',
  price: '0',
  duration: '12,5',
  thumbnail: 'https://images.unsplash.com/photo-1555066931-bf19f8fd1085',
  trailerUrl: 'https://example.org/trailer.mp4?token=sample',
};

test('Base URL rejects placeholders, other hosts and individual resource URLs', () => {
  assert.equal(
    normalizeBaseUrl(' https://test.mockapi.io/api/v1/ '),
    'https://test.mockapi.io/api/v1',
  );
  for (const url of [
    '',
    'https://YOUR_PROJECT_ID.mockapi.io/api/v1',
    'https://example.org/api',
    'http://test.mockapi.io/api/v1',
    'https://test.mockapi.io/api/v1/courses',
    'https://test.mockapi.io/api?v=1',
  ])
    assert.throws(() => normalizeBaseUrl(url));
});
test('Course validation accepts free courses and decimal commas', () => {
  assert.deepEqual(validateCourse(values, categories), {});
  const input = toCourseInput(values);
  assert.equal(input.price, 0);
  assert.equal(input.duration, 12.5);
  assert.equal(input.title, 'React Native');
});
test('Course validation rejects negative, blank, infinite and ambiguous prices', () => {
  for (const price of ['-1', '', ' ', 'Infinity', 'NaN', '1e3', '500.000.000'])
    assert.ok(validateCourse({ ...values, price }, categories).price);
  for (const duration of ['0', '-5', '', 'NaN'])
    assert.ok(validateCourse({ ...values, duration }, categories).duration);
});
test('Course validation requires existing category and playable direct trailer URLs', () => {
  assert.ok(validateCourse(values, []).categoryId);
  assert.ok(
    validateCourse(
      { ...values, trailerUrl: 'https://youtube.com/watch?v=test' },
      categories,
    ).trailerUrl,
  );
  assert.ok(
    validateCourse({ ...values, thumbnail: 'not a url' }, categories).thumbnail,
  );
  for (const field of ['title', 'description', 'instructor'])
    assert.ok(validateCourse({ ...values, [field]: ' ' }, categories)[field]);
});
test('Search is accent-insensitive and combines title and category filters', () => {
  const courses = [
    { title: 'Lập trình Android', categoryId: '8' },
    { title: 'Lập trình Web', categoryId: '2' },
    { title: 'Đồ họa', categoryId: '8' },
  ];
  assert.equal(searchCourses(courses, 'lap trinh', '8').length, 1);
  assert.equal(searchCourses(courses, 'do hoa', '').length, 1);
  assert.equal(searchCourses(courses, 'không tồn tại', '').length, 0);
  assert.equal(formatPrice(0), 'Miễn phí');
});
test('API parsing rejects malformed JSON shapes and normalizes numeric IDs', () => {
  assert.equal(parseCategory({ id: 8, name: 'Mobile' }).id, '8');
  assert.throws(() => parseCategory({ name: 'Mobile' }), ApiError);
  assert.throws(() => parseCourse({}), ApiError);
  assert.throws(
    () => parseCourse({ ...toCourseInput(values), id: '1', price: null }),
    ApiError,
  );
});
test('REST client sends correct methods, preserves createdAt on edit and handles API errors', async () => {
  const original = globalThis.fetch;
  const calls = [];
  const course = { ...toCourseInput(values), id: '1', createdAt: '2026-10-13' };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    const body =
      url.endsWith('/categories') && options.method === 'GET'
        ? categories
        : url.includes('/categories')
          ? { id: '8', name: 'Mobile', description: '' }
          : url.endsWith('/courses') && options.method === 'GET'
            ? [course]
            : course;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    const api = createApi('https://test.mockapi.io/api/v1');
    assert.equal((await api.getCategories())[0].id, '8');
    assert.equal((await api.getCourses()).length, 1);
    assert.equal((await api.getCourse('1')).id, '1');
    await api.saveCourse(toCourseInput(values));
    assert.equal(calls.at(-1).method, 'POST');
    assert.ok(JSON.parse(calls.at(-1).body).createdAt);
    await api.saveCourse(toCourseInput(values), '1');
    assert.equal(calls.at(-1).method, 'PUT');
    assert.equal(JSON.parse(calls.at(-1).body).createdAt, undefined);
    await api.deleteCourse('1/2');
    assert.equal(calls.at(-1).method, 'DELETE');
    assert.ok(calls.at(-1).url.endsWith('/courses/1%2F2'));
    await api.saveCategory({ name: 'New', description: '' });
    assert.equal(calls.at(-1).method, 'POST');
    await api.saveCategory({ name: 'Edited', description: '' }, '8');
    assert.equal(calls.at(-1).method, 'PUT');
    await api.deleteCategory('8');
    assert.equal(calls.at(-1).method, 'DELETE');
    globalThis.fetch = async () => new Response('', { status: 404 });
    await assert.rejects(
      api.getCourses(),
      (error) => error instanceof ApiError && error.status === 404,
    );
    globalThis.fetch = async () => new Response('not json', { status: 200 });
    await assert.rejects(api.getCourses(), /JSON/);
    globalThis.fetch = async () => {
      throw new TypeError('network down');
    };
    await assert.rejects(api.getCourses(), /MockAPI/);
  } finally {
    globalThis.fetch = original;
  }
});

test('Seed script creates valid API relationships and can be re-run without duplicates', () => {
  const directory = mkdtempSync(join(tmpdir(), 'course-seed-test-'));
  const storePath = join(directory, 'store.json');
  const preloadPath = join(directory, 'mock-fetch.mjs');
  writeFileSync(
    storePath,
    JSON.stringify({ categories: [], courses: [], nextId: 81 }),
  );
  writeFileSync(
    preloadPath,
    `
    import { readFileSync, writeFileSync } from 'node:fs';
    const file = process.env.COURSE_SEED_TEST_STORE;
    globalThis.fetch = async (url, options) => {
      const resource = new URL(url).pathname.split('/').at(-1);
      const store = JSON.parse(readFileSync(file, 'utf8'));
      if (!store[resource]) return new Response('{}', { status: 404 });
      let result = store[resource];
      if (options.method === 'POST') {
        result = { ...JSON.parse(options.body), id: String(store.nextId++) };
        store[resource].push(result);
        writeFileSync(file, JSON.stringify(store));
      }
      return new Response(JSON.stringify(result), { status: 200 });
    };
  `,
  );
  for (let run = 0; run < 2; run++) {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        pathToFileURL(preloadPath).href,
        fileURLToPath(new URL('./seed-mockapi.mjs', import.meta.url)),
        'https://seed-check.mockapi.io/api/v1',
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, COURSE_SEED_TEST_STORE: storePath },
        timeout: 30000,
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const data = JSON.parse(readFileSync(storePath, 'utf8'));
    assert.equal(data.categories.length, 3);
    assert.equal(data.courses.length, 10);
    assert.ok(
      data.courses.every((course) =>
        data.categories.some((category) => category.id === course.categoryId),
      ),
    );
    assert.ok(
      data.courses.every(
        (course) =>
          typeof course.price === 'number' &&
          course.createdAt &&
          course.thumbnail.startsWith('https://') &&
          course.trailerUrl.endsWith('.mp4'),
      ),
    );
  }
});
