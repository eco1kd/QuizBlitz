import { test, expect, type Page } from '@playwright/test'

async function createRoom(page: Page, nickname = 'Nonwire') {
  await page.getByRole('button', { name: 'Создать игру', exact: true }).click()
  await page.getByRole('textbox', { name: 'Твой ник' }).fill(nickname)
  await page.getByRole('button', { name: 'Поехали!' }).click()
  await page.getByRole('textbox', { name: 'Тема викторины' }).fill('Космос')
  await page.getByRole('button', { name: '3 вопросов', exact: true }).click()
  await page
    .getByRole('button', { name: 'Создать комнату', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Все в сборе?' }),
  ).toBeVisible()
}

test('guest creates configured room with QR, adds player and copies invite', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await createRoom(page)
  await expect(page.locator('.room-tags')).toContainText('3 вопросов')
  await expect(page.locator('.player-tile.is-me')).toContainText('Nonwire')
  await expect(page.locator('.qr-frame svg')).toBeVisible()
  await page.getByRole('button', { name: 'Демо-игрок', exact: true }).click()
  await expect(
    page.locator('.player-tile:not(.player-placeholder)'),
  ).toHaveCount(2)
  const code = (await page.locator('.room-code').textContent())!.replace(
    /\D/g,
    '',
  )
  await page
    .getByRole('button', { name: 'Скопировать ссылку', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Ссылка скопирована' }),
  ).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    `?code=${code}#join`,
  )
})

test('unknown room is rejected; a guest never sees the start control', async ({
  page,
}) => {
  await page.goto('/?code=000000#join')
  await page.getByRole('textbox', { name: 'Твой ник' }).fill('Игрок')
  await page.getByRole('button', { name: 'Войти в игру', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Комната не найдена')
  await page.getByRole('button', { name: '849215', exact: true }).click()
  await page.getByRole('button', { name: 'Войти в игру', exact: true }).click()
  await expect(page.getByText('Ждём, когда ведущий начнёт игру')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать игру', exact: true }),
  ).toHaveCount(0)
})

test('whitespace nickname is rejected and Escape closes the modal', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('textbox', { name: 'Твой ник' }).fill('   ')
  await page.getByRole('button', { name: 'Поехали!' }).click()
  await expect(page.getByRole('alert')).toContainText('от 2 до 20')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('demo registration persists profile but never stores password', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('button', { name: 'Регистрация', exact: true }).click()
  await page.getByRole('textbox', { name: 'Твой ник' }).fill('Nonwire')
  await page.getByRole('textbox', { name: 'Почта' }).fill('nonwire@example.com')
  await page.getByLabel('Пароль', { exact: true }).fill('test-demo-only')
  await page.getByRole('button', { name: 'Создать аккаунт' }).click()
  await expect(page.locator('.user-chip')).toContainText('Nonwire')
  await page.reload()
  await page.getByRole('button', { name: 'Профиль', exact: true }).click()
  await expect(page.locator('.profile-card')).toContainText(
    'nonwire@example.com',
  )
  await expect(page.getByText('Первая игра ещё впереди')).toBeVisible()
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  )
  expect(stored).not.toContain('test-demo-only')
})

test('completed demo round flows into existing game screens and history', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/')
  await createRoom(page)
  await page.getByRole('button', { name: 'Начать игру', exact: true }).click()
  for (let question = 1; question <= 3; question++) {
    await expect(
      page.getByText(`Вопрос ${question} из 3`, { exact: false }),
    ).toBeVisible()
    await page
      .getByRole('button', {
        name: ['Уран', 'Transformer', 'Кобальт'][question - 1],
        exact: true,
      })
      .click()
    await page.clock.runFor(11000)
  }
  await expect(
    page.getByRole('heading', { name: 'Подиум победителей' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'История', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Выйти', exact: true })
    .click()
  await expect(page.locator('.history-row')).toHaveCount(1)
  await expect(page.locator('.history-row')).toContainText('Космос')
})

for (const width of [320, 390, 768, 1440]) {
  test(`responsive layout at ${width}px has no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Ну что, сыграем?' }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
    await createRoom(page)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  })
}

test('real server: two clients, host role survives reload, disconnect never switches to demo', async ({
  browser,
}) => {
  test.skip(
    !process.env.LIVE_E2E_URL,
    'Set LIVE_E2E_URL with the Node backend and live-mode frontend running.',
  )
  const url = process.env.LIVE_E2E_URL!
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()
  try {
    const host = await hostContext.newPage()
    const guest = await guestContext.newPage()
    await host.addInitScript(() => {
      const NativeWebSocket = window.WebSocket
      const sockets: WebSocket[] = []
      window.WebSocket = class extends NativeWebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols)
          if (String(url).includes('/socket.io/')) sockets.push(this)
        }
      }
      Object.assign(window, { __testSockets: sockets })
    })
    await host.goto(url)
    await createRoom(host, 'Host')
    const code = (await host.locator('.room-code').textContent())!.replace(
      /\D/g,
      '',
    )
    await guest.goto(`${url}/?code=${code}#join`)
    await guest.getByRole('textbox', { name: 'Твой ник' }).fill('Guest')
    await guest
      .getByRole('button', { name: 'Войти в игру', exact: true })
      .click()
    await expect(host.getByText('Guest', { exact: true })).toBeVisible()
    await expect(
      guest.getByRole('button', { name: 'Начать игру', exact: true }),
    ).toHaveCount(0)
    await host.reload()
    await expect(host.locator('.room-code')).toContainText(
      `${code.slice(0, 3)} ${code.slice(3)}`,
    )
    await expect(
      host.locator('.player-tile:not(.player-placeholder)'),
    ).toHaveCount(2)
    await hostContext.setOffline(true)
    await host.evaluate(() => {
      const sockets = (window as unknown as { __testSockets: WebSocket[] })
        .__testSockets
      sockets.forEach((socket) => socket.close())
    })
    await expect(
      host.getByText('Нет связи с игровым сервером.', { exact: false }),
    ).toBeVisible()
    await expect(
      host.getByText('Демо · без подключения к серверу', { exact: false }),
    ).toHaveCount(0)
    await hostContext.setOffline(false)
    await expect(host.locator('.connection-banner')).toHaveCount(0)
    await expect(host.locator('.room-code')).toContainText(
      `${code.slice(0, 3)} ${code.slice(3)}`,
    )
    await host.getByRole('button', { name: 'Начать игру', exact: true }).click()
    await expect(host.locator('.game-stage')).toBeVisible()
    await expect(guest.locator('.game-stage')).toBeVisible()
    await expect(
      host.getByText('Вопрос 1 из 3', { exact: false }),
    ).toBeVisible()
    await expect(
      guest.getByText('Вопрос 1 из 3', { exact: false }),
    ).toBeVisible()
  } finally {
    await hostContext.close()
    await guestContext.close()
  }
})
