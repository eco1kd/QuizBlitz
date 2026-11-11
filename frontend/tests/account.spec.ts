import { test, expect } from '@playwright/test'

const url = 'http://127.0.0.1:5182'
const api = 'http://127.0.0.1:3101/api'
const user = {
  id: 'contract-user',
  nickname: 'Nonwire',
  avatar: '⚡',
  isGuest: false,
}

// These are frontend contract fixtures, not an implementation of the team's REST API.
for (const mode of ['guest', 'login', 'register'] as const) {
  test(`REST contract: ${mode}, bearer profile/history and logout`, async ({
    page,
  }) => {
    let authBody: unknown
    const protectedHeaders: string[] = []
    await page.route(`${api}/**`, async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      if (path === `/api/auth/${mode}`) {
        expect(request.method()).toBe('POST')
        authBody = request.postDataJSON()
        await route.fulfill({ json: { token: 'contract-test-token', user } })
      } else {
        protectedHeaders.push(request.headers().authorization)
        expect(request.method()).toBe('GET')
        if (path === '/api/me') await route.fulfill({ json: user })
        else if (path === '/api/games/history')
          await route.fulfill({
            json: [
              {
                id: 'game-fixture',
                topic: 'История Рима',
                playedAt: '2026-11-10T12:00:00Z',
                score: 2100,
                rank: 1,
                players: 4,
                questionCount: 3,
              },
            ],
          })
        else throw new Error(`Unexpected API request: ${path}`)
      }
    })
    await page.goto(url)
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    if (mode !== 'guest') {
      await page
        .getByLabel('Способ входа')
        .getByRole('button', {
          name: mode === 'login' ? 'Войти' : 'Регистрация',
          exact: true,
        })
        .click()
      await page
        .getByRole('textbox', { name: 'Почта' })
        .fill('nonwire@example.com')
      await page
        .getByLabel('Пароль', { exact: true })
        .fill('test-only-password')
    }
    if (mode !== 'login')
      await page.getByRole('textbox', { name: 'Твой ник' }).fill('Nonwire')
    await page
      .getByRole('button', {
        name:
          mode === 'guest'
            ? 'Поехали!'
            : mode === 'login'
              ? 'Войти в аккаунт'
              : 'Создать аккаунт',
        exact: true,
      })
      .click()
    await expect(page.locator('.user-chip')).toContainText('Nonwire')
    expect(authBody).toEqual(
      mode === 'guest'
        ? { nickname: 'Nonwire' }
        : {
            ...(mode === 'register' ? { nickname: 'Nonwire' } : {}),
            email: 'nonwire@example.com',
            password: 'test-only-password',
          },
    )
    await page.getByRole('button', { name: 'Профиль', exact: true }).click()
    await expect(page.locator('.history-row')).toContainText('История Рима')
    // StrictMode can repeat mount effects in development.
    expect(protectedHeaders.length).toBeGreaterThanOrEqual(2)
    expect(
      protectedHeaders.every((value) => value === 'Bearer contract-test-token'),
    ).toBe(true)
    const storage = await page.evaluate(() =>
      JSON.stringify({ ...localStorage, ...sessionStorage }),
    )
    expect(storage).not.toContain('test-only-password')
    await page.getByRole('button', { name: 'Выйти', exact: true }).click()
    await expect(page.locator('.user-chip')).toHaveCount(0)
    expect(
      await page.evaluate(() => JSON.stringify(sessionStorage)),
    ).not.toContain('contract-test-token')
  })
}

test('current backend has no REST auth: UI shows the error without fake login', async ({
  page,
}) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('textbox', { name: 'Твой ник' }).fill('Nonwire')
  const response = page.waitForResponse(`${api}/auth/guest`)
  await page.getByRole('button', { name: 'Поехали!' }).click()
  expect((await response).status()).toBe(404)
  await expect(page.getByRole('alert')).toContainText('Сервис пока недоступен')
  await expect(page.locator('.user-chip')).toHaveCount(0)
})

test('REST rejects malformed auth and expired session instead of inventing a profile', async ({
  page,
}) => {
  let validAuth = false
  await page.route(`${api}/auth/guest`, (route) =>
    route.fulfill({
      json: validAuth ? { token: 'contract-test-token', user } : { user },
    }),
  )
  await page.route(`${api}/me`, (route) =>
    route.fulfill({ status: 401, json: {} }),
  )
  await page.route(`${api}/games/history`, (route) =>
    route.fulfill({ status: 401, json: {} }),
  )
  await page.goto(url)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('textbox', { name: 'Твой ник' }).fill('Nonwire')
  await page.getByRole('button', { name: 'Поехали!' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Неполный ответ авторизации',
  )
  validAuth = true
  await page.getByRole('button', { name: 'Поехали!' }).click()
  await expect(page.locator('.user-chip')).toContainText('Nonwire')
  await page.getByRole('button', { name: 'Профиль', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Сессия истекла')
  await expect(page.locator('.history-row')).toHaveCount(0)
})
