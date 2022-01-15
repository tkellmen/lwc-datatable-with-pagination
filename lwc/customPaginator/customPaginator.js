import { LightningElement, api, track } from "lwc";

const recordsPerPage = [
	{ label: "3", value: 3 },
	{ label: "5", value: 5 },
	{ label: "10", value: 10 },
	{ label: "25", value: 25 },
	{ label: "50", value: 50 },
	{ label: "200", value: 200 }
];

const showIt = "visibility:visible";
const hideIt = "visibility:hidden";

export default class CustomPaginator extends LightningElement {
	@api defaultPageSize;

	@api searchBorder = "rgb(237, 139, 0)";
	@api searchInputColor = "rgb(136, 139, 141)";

	@api recordsPerPageSelectorColor = "rgb(136, 139, 141)";
	@api recordsPerPageSelectorBorder = "rgb(237, 139, 0)";

	@api styleParameters = {};

	@track pageSizeOptions = recordsPerPage;
	@track controlPagination = showIt;
	@track controlPrevious = hideIt;
	@track controlNext = showIt;
	@track pageNumber_;

	pageSize;
	totalPages_;
	recordsLength_;
	currentLength_;
	optionValue = 3;

	// if need add some css code
	// pass name in customComponentName variable
	// using next expression
	//  .customComponentName .custom-datatable a {
	//   border: 0px;
	// }
	@api customComponentName = "";

	// flags
	@api
	hideSearch = false;
	@api
	hidePagination = false;

	@api
	searchPlaceholder = "Start typing to filter rows";

	showingRecordsPlaceholder_ = "";

	searchKey = "";

	connectedCallback() {
		if (this.defaultPageSize) {
			this.optionValue = this.defaultPageSize;
		}
		// this.setPaginationControls();
	}
	renderedCallback() {
		this.setStyleVariables();
		//code
	}

	handleRecordsPerPage(event) {
		this.optionValue = Number(event.detail.value);
		this.pageSize = event.target.value;

		this.dispatchEvent(new CustomEvent("recordsperpageevent", { detail: event }));
	}

	//by focus
	recordPerPageClickHandler(event) {
		// console.log("recordPerPageClickHandler", event.detail);
		this.dispatchEvent(new CustomEvent("perpageclick", { detail: event }));
	}

	searchFocusHandler(event) {
		this.dispatchEvent(new CustomEvent("searchfocus", { detail: event }));
	}

	handleKeyChange(event) {
		this.searchKey = event.detail.value;
		this.dispatchEvent(new CustomEvent("search", { detail: event }));
	}

	handlePreviousPage() {
		this.dispatchEvent(new CustomEvent("previouspage", { detail: "previouspage" }));
	}

	handlePageNumberChange(event) {
		this.dispatchEvent(new CustomEvent("pagenumberchange", { detail: event }));
	}

	handleNextPage() {
		this.dispatchEvent(new CustomEvent("nextpage", { detail: "nextpage" }));
	}

	// get entriesLabel() {
	//   return entriesCustomLabel;
	// }

	@api
	setPaginationControls() {
		if (this.totalPages === 1) {
			this.controlPrevious = hideIt;
			this.controlNext = hideIt;
		} else if (this.totalPages > 1) {
			this.controlPrevious = showIt;
			this.controlNext = showIt;
		}

		if (this.pageNumber_ <= 1) {
			this.pageNumber_ = 1;
			this.controlPrevious = hideIt;
		} else if (this.pageNumber >= this.totalPages) {
			this.pageNumber_ = this.totalPages;
			this.controlNext = hideIt;
		}

		if (this.controlPagination === hideIt) {
			this.controlPrevious = hideIt;
			this.controlNext = hideIt;
		}
	}

	setStyleVariables() {
		let defaultParams = {
			recordsPerPageSelectorColor: "rgb(136, 139, 141)",
			recordsPerPageSelectorBorder: "rgb(237, 139, 0)",
			searchInputColor: "rgb(136, 139, 141)",
			searchBorder: "rgb(237, 139, 0)",
			footerPaginationColor: "rgb(136, 139, 141)",
			footerInputPaginationBorder: "rgb(237, 139, 0)",
			footerInputPaginationColor: "rgb(136, 139, 141)",
			recordsPerPageBorder: "rgb(237, 139, 0)",
			recordsPerPageColor: "rgb(136, 139, 141)",
			recordsPerPageSideTextColor: "rgb(136, 139, 141)"
		};
		this.defaultParams = defaultParams;

		let searchInput = this.template.querySelector(".custom-paginator.search.form-control");

		let recordsPerPageSelector = this.template.querySelector(".custom-paginator.records-per-page.form-control");

		let footerInputPagination = this.template.querySelector(".custom-paginator.footer-pagination-input-class");
		let footerPagination = this.template.querySelector(".custom-paginator.footer-pagination-class");

		let footerPaginationAll = this.template.querySelectorAll(".custom-paginator.footer-pagination-class");

		for (let index = 0; index < footerPaginationAll.length; index++) {
			footerPaginationAll[index]?.style?.setProperty(
				"color",
				this.styleParameters.hasOwnProperty("footerPaginationColor")
					? this.styleParameters.footerPaginationColor
					: defaultParams.footerPaginationColor
			);
		}

		//

		searchInput?.style?.setProperty(
			"--separator-color",
			this.styleParameters.hasOwnProperty("searchBorder")
				? this.styleParameters.searchBorder
				: defaultParams.searchBorder
		);

		searchInput?.style?.setProperty(
			"--lwc-colorBorderInput",
			this.styleParameters.hasOwnProperty("searchBorder")
				? this.styleParameters.searchBorder
				: defaultParams.searchBorder
		);

		searchInput?.style?.setProperty(
			"--lwc-colorBorderInputActive",
			this.styleParameters.hasOwnProperty("searchBorder")
				? this.styleParameters.searchBorder
				: defaultParams.searchBorder
		);

		searchInput?.style?.setProperty(
			"color",

			this.styleParameters.hasOwnProperty("searchInputColor")
				? this.styleParameters.searchInputColor
				: defaultParams.searchInputColor
		);

		//* recordsPerPageSelector

		recordsPerPageSelector?.style?.setProperty(
			"--lwc-colorBorderInput",

			this.styleParameters.hasOwnProperty("recordsPerPageBorder")
				? this.styleParameters.recordsPerPageBorder
				: defaultParams.recordsPerPageBorder
		);

		recordsPerPageSelector?.style?.setProperty(
			"--lwc-colorBorderBrandPrimary",
			this.styleParameters.hasOwnProperty("recordsPerPageBorder")
				? this.styleParameters.recordsPerPageBorder
				: defaultParams.recordsPerPageBorder
		);

		recordsPerPageSelector?.style?.setProperty(
			"--lwc-colorBorder",
			this.styleParameters.hasOwnProperty("recordsPerPageBorder")
				? this.styleParameters.recordsPerPageBorder
				: defaultParams.recordsPerPageBorder
		);

		recordsPerPageSelector?.style?.setProperty(
			"color",
			this.styleParameters.hasOwnProperty("recordsPerPageSideTextColor")
				? this.styleParameters.recordsPerPageSideTextColor
				: defaultParams.recordsPerPageSideTextColor
		);

		recordsPerPageSelector?.style?.setProperty(
			"--sds-c-input-text-color",
			this.styleParameters.hasOwnProperty("recordsPerPageColor")
				? this.styleParameters.recordsPerPageColor
				: defaultParams.recordsPerPageColor
		);

		recordsPerPageSelector?.style?.setProperty(
			"--lwc-colorTextDefault",
			this.styleParameters.hasOwnProperty("recordsPerPageColor")
				? this.styleParameters.recordsPerPageColor
				: defaultParams.recordsPerPageColor
		);

		// footer
		let inputBorder = this.styleParameters.hasOwnProperty("footerInputPaginationBorder")
			? this.styleParameters.footerInputPaginationBorder
			: defaultParams.footerInputPaginationBorder;

		footerInputPagination?.style?.setProperty("border", "1px solid " + inputBorder);

		footerInputPagination?.style?.setProperty(
			"color",
			this.styleParameters.hasOwnProperty("footerInputPaginationColor")
				? this.styleParameters.footerInputPaginationColor
				: defaultParams.footerInputPaginationColor
		);

		footerPagination?.style?.setProperty(
			"color",

			this.styleParameters.hasOwnProperty("footerPaginationColor")
				? this.styleParameters.footerPaginationColor
				: defaultParams.footerPaginationColor
		);
	}

	@api
	get totalPages() {
		return this.totalPages_;
	}

	set totalPages(value) {
		this.totalPages_ = value;
		this.setPaginationControls();
	}

	@api
	get pageNumber() {
		return this.pageNumber_;
	}

	set pageNumber(value) {
		if (this.pageNumber_ !== value) {
			this.pageNumber_ = value;
			this.setPaginationControls();
		}
		this.pageNumber_ = value;
	}

	@api
	get recordsLength() {
		return this.recordsLength_;
	}

	set recordsLength(value) {
		if (this.recordsLength_ !== value) {
			this.recordsLength_ = value;
			this.setPaginationControls();
		}
		this.recordsLength_ = value;
	}

	@api
	get currentLength() {
		return this.currentLength_;
	}

	set currentLength(value) {
		if (this.currentLength_ !== value) {
			this.currentLength_ = value;
			this.setPaginationControls();
		}
		this.currentLength_ = value;
	}

	//!!need to fix
	@api
	get showingRecordsPlaceholder() {
		let replaceString;
		if (!this.totalRecordsLength || !this.currentLength) {
			return replaceString;
		}

		replaceString = this.showingRecordsPlaceholder_.replace("{totalRecordsLength}", this.recordsLength);

		replaceString = replaceString.replace("{currentLength}", this.currentLength);

		return replaceString;
	}

	set showingRecordsPlaceholder(value) {
		this.showingRecordsPlaceholder_ = value;
	}

	get searchClass() {
		return this.customComponentName + "custom-paginator search form-control";
	}

	get recordPerPageClass() {
		return this.customComponentName + "custom-paginator records-per-page form-control";
	}

	get footerPaginationInputClass() {
		return this.customComponentName + " custom-paginator footer-pagination-input-class input2";
	}
	get footerPaginationClass() {
		return this.customComponentName + " custom-paginator footer-pagination-class ";
	}

	get showSearchState() {
		if (this.totalPages) return true;
		if (this.searchKey) return true;

		return false;
	}
}
