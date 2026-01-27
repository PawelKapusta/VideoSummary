import { type Page, type Locator, expect } from "@playwright/test";

export class VideosFilterBarComponent {
  readonly page: Page;
  readonly filterBar: Locator;

  // Search elements
  readonly searchInput: Locator;
  readonly searchLabel: Locator;

  // Status filter
  readonly statusSelect: Locator;
  readonly statusLabel: Locator;

  // Channel filter
  readonly channelSelect: Locator;
  readonly channelLabel: Locator;

  // Date range filter
  readonly dateRangeContainer: Locator;
  readonly dateFromButton: Locator;
  readonly dateToButton: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly dateRangeLabel: Locator;

  // Actions
  readonly clearFiltersButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterBar = page.locator('[data-testid="filter-bar"]');

    // Search elements
    this.searchInput = this.filterBar.locator('input[type="text"]');
    this.searchLabel = this.filterBar.locator("label").filter({ hasText: "Search by title or channel" });

    // Status filter
    this.statusSelect = this.filterBar.locator("select").first();
    this.statusLabel = this.filterBar.locator("label").filter({ hasText: "Status" });

    // Channel filter
    this.channelSelect = this.filterBar.locator("select").nth(1);
    this.channelLabel = this.filterBar.locator("label").filter({ hasText: "Channel" });

    // Date range filter
    this.dateRangeContainer = this.filterBar
      .locator("div")
      .filter({ has: page.locator("label").filter({ hasText: "Publication Date" }) });
    this.dateRangeLabel = this.filterBar.locator("label").filter({ hasText: "Publication Date" });
    this.dateFromButton = this.dateRangeContainer.locator("button").filter({ hasText: "Select date" }).first();
    this.dateToButton = this.dateRangeContainer.locator("button").filter({ hasText: "Select date" }).nth(1);
    this.dateFromInput = page.locator("#from-date-input");
    this.dateToInput = page.locator("#to-date-input");

    // Actions
    this.clearFiltersButton = page.locator("button").filter({ hasText: "Clear all filters" });
  }

  async expectVisible() {
    await expect(this.filterBar).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.statusSelect).toBeVisible();
    await expect(this.channelSelect).toBeVisible();
  }

  async expectEnabled() {
    await expect(this.searchInput).toBeEnabled();
    await expect(this.statusSelect).toBeEnabled();
    await expect(this.channelSelect).toBeEnabled();
  }

  async expectDisabled() {
    await expect(this.searchInput).toBeDisabled();
    await expect(this.statusSelect).toBeDisabled();
    await expect(this.channelSelect).toBeDisabled();
  }

  async search(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    // Wait for debounced search (500ms from implementation)
    await this.page.waitForTimeout(600);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(600);
  }

  async selectStatus(status: "all" | "with" | "without") {
    const value = status === "all" ? "all" : status === "with" ? "with" : "without";
    await this.statusSelect.selectOption(value);
  }

  async selectChannel(channelName: string) {
    await this.channelSelect.selectOption({ label: channelName });
  }

  async selectAllChannels() {
    await this.channelSelect.selectOption({ label: "All Channels" });
  }

  async getAvailableChannels(): Promise<string[]> {
    const options = await this.channelSelect.locator("option").allTextContents();
    return options.filter((opt) => opt !== "All Channels");
  }

  async setDateFrom(dateString: string) {
    await this.dateFromButton.click();
    await this.dateFromInput.fill(dateString);
  }

  async setDateTo(dateString: string) {
    await this.dateToButton.click();
    await this.dateToInput.fill(dateString);
  }

  async clearDateRange() {
    // Click date buttons to access inputs, then clear them
    await this.dateFromButton.click();
    await this.dateFromInput.fill("");
    await this.dateToButton.click();
    await this.dateToInput.fill("");
  }

  async clearAllFilters() {
    await this.clearFiltersButton.click();
  }

  async getCurrentSearchValue() {
    return await this.searchInput.inputValue();
  }

  async getCurrentStatusValue() {
    return await this.statusSelect.inputValue();
  }

  async getCurrentChannelValue() {
    return await this.channelSelect.inputValue();
  }

  async getCurrentDateFromValue() {
    return await this.dateFromInput.inputValue();
  }

  async getCurrentDateToValue() {
    return await this.dateToInput.inputValue();
  }

  async expectSearchPlaceholder(expectedPlaceholder = "Enter keywords...") {
    await expect(this.searchInput).toHaveAttribute("placeholder", expectedPlaceholder);
  }

  async expectStatusOptions(expectedOptions: string[]) {
    const options = await this.statusSelect.locator("option").allTextContents();
    expect(options).toEqual(expectedOptions);
  }

  async expectChannelOptions(expectedChannels: string[]) {
    const options = await this.channelSelect.locator("option").allTextContents();
    expect(options).toEqual(["All Channels", ...expectedChannels]);
  }

  async expectDateRangeVisible() {
    await expect(this.dateRangeContainer).toBeVisible();
    await expect(this.dateFromButton).toBeVisible();
    await expect(this.dateToButton).toBeVisible();
  }

  async expectClearFiltersButtonEnabled() {
    await expect(this.clearFiltersButton).toBeEnabled();
  }

  async expectClearFiltersButtonDisabled() {
    await expect(this.clearFiltersButton).toBeDisabled();
  }

  async isAnyFilterActive(): Promise<boolean> {
    const searchValue = await this.getCurrentSearchValue();
    const statusValue = await this.getCurrentStatusValue();
    const channelValue = await this.getCurrentChannelValue();
    const dateFromValue = await this.getCurrentDateFromValue();
    const dateToValue = await this.getCurrentDateToValue();

    return (
      searchValue.trim() !== "" ||
      statusValue !== "all" ||
      channelValue !== "all" ||
      dateFromValue !== "" ||
      dateToValue !== ""
    );
  }

  async getActiveFiltersCount(): Promise<number> {
    let count = 0;
    const searchValue = await this.getCurrentSearchValue();
    const statusValue = await this.getCurrentStatusValue();
    const channelValue = await this.getCurrentChannelValue();
    const dateFromValue = await this.getCurrentDateFromValue();
    const dateToValue = await this.getCurrentDateToValue();

    if (searchValue.trim() !== "") count++;
    if (statusValue !== "all") count++;
    if (channelValue !== "all") count++;
    if (dateFromValue !== "") count++;
    if (dateToValue !== "") count++;

    return count;
  }
}
