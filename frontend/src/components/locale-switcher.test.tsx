import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { setLocale } from "@/i18n/actions"
import { render } from "@/test/render"

vi.mock("@/i18n/actions", () => ({ setLocale: vi.fn() }))

describe("LocaleSwitcher", () => {
  beforeEach(() => vi.mocked(setLocale).mockClear())

  it("switches to the language the visitor picks", async () => {
    const user = userEvent.setup()
    render(<LocaleSwitcher />)

    await user.click(screen.getByRole("combobox", { name: "Language" }))
    await user.click(await screen.findByRole("option", { name: "Português" }))

    expect(setLocale).toHaveBeenCalledExactlyOnceWith("pt-PT")
  })

  it("does nothing when the visitor picks the current language", async () => {
    const user = userEvent.setup()
    render(<LocaleSwitcher />)

    await user.click(screen.getByRole("combobox", { name: "Language" }))
    await user.click(await screen.findByRole("option", { name: "English" }))

    expect(setLocale).not.toHaveBeenCalled()
  })
})
