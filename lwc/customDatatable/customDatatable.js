/* eslint-disable @lwc/lwc/no-async-operation */
import { LightningElement, api, track } from "lwc";
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import { NavigationMixin } from "lightning/navigation";
import staticStyles from "@salesforce/resourceUrl/customDatatable";

export default class customDatatable extends NavigationMixin(LightningElement) {
	@api columns;
	@api defaultPageSize;
	@api fieldsNotUseInSearch = [];
	@api paginationEnabled = false;
	@api hideCheckboxColumn = false;

	// if need add some css code in static resources
	// pass name in customTableName variable
	// using next expression
	//  .customTableName .custom-datatable a {
	//   border: 0px;
	// }
	@api customTableName = "";

	// pass next variable if you need correction URL column name
	// pass from parent  example
	// sortedNameCorrection={
	// customURL:'Name'
	// }
	//
	@api sortedNameCorrection = {};

	// pass style parameters to override style
	// pass from parent  example
	// styleParameters={
	//  textFontSize: 14,
	// }
	//

	@api showRowNumberColumn = false;

	// if the parameters defined in the setTableStyleVariables method are not enough, add the missing parameters with
	//?? https://developer.salesforce.com/docs/atlas.en-us.202.0.lightning.meta/lightning/tokens_standard_force_base.htm
	@api styleParameters = {};

	@track pageSize = 0;
	@track recordsToDisplay = [];
	@track
	pageNumber = 1;
	@track
	totalRecords_ = [];
	@track
	spinner_;
	@track
	preSelectedRows = { 1: [] };
	selectedItems_ = new Set();
	totalPages = 0;
	@track searchKey = "";
	@track searchItems = {};

	//sort variables
	@track sortedBy;
	@track sortedDirection;

	@track stylesLoaded = false;
	mistakenFire = false;

	@track defaultParams = {};
	bufferRecords = [];

	connectedCallback() {
		this.showTable = false;

		if (this.defaultPageSize) {
			this.pageSize = this.defaultPageSize;
			this.optionValue = this.defaultPageSize;
		} else {
			this.pageSize = this.totalRecords_?.length;
		}

		this.setRecordsToDisplay();
		this.showTable = true;
	}

	renderedCallback() {
		console.log("renderedCallback");
		if (!this.stylesLoaded) {
			this.setTableStyleVariables();

			if (staticStyles == null) {
				this.stylesLoaded = true;
				return;
			}
			loadStyle(this, staticStyles)
				.then((e) => {
					this.stylesLoaded = true;
				})
				.catch((error) => {
					console.log(error);
					this.stylesLoaded = true;
				});
		}
	}

	setRecordsToDisplay() {
		this.mistakenFire = true;

		this.bufferRecords = {};

		if (this.searchKey !== "") {
			this.bufferRecords = this.searchItems;
		} else {
			this.bufferRecords = this.totalRecords_;
		}

		if (!this.paginationEnabled || this.paginationEnabled === null) {
			this.pageSize = this.bufferRecords?.length;
		} else {
			if (!this.pageSize) this.pageSize = this.bufferRecords?.length;
		}

		this.recordsToDisplay = [];

		this.totalPages = Math.ceil(this.bufferRecords?.length / this.pageSize);

		for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
			if (i >= this.bufferRecords?.length || this.bufferRecords === undefined) {
				break;
			}
			try {
				this.recordsToDisplay.push(this.bufferRecords[i]);
			} catch (error) {
				console.log(error);
			}
		}

		this.updatePaginatorState();

		setTimeout(() => {
			this.mistakenFire = false;
		}, 500);

		this.spinner_ = false;
	}

	@api previousPageHandler() {
		this.spinner_ = true;
		this.calculatePreSelectedRows();
		this.pageNumber = this.pageNumber - 1;
		this.setRecordsToDisplay();
	}

	@api nextPageHandler() {
		this.spinner_ = true;

		this.calculatePreSelectedRows();
		this.pageNumber = this.pageNumber + 1;
		this.setRecordsToDisplay();
	}
	@api pageNumberChangeHandler(event) {
		this.spinner_ = true;

		this.calculatePreSelectedRows();
		if (event.detail.target.value < 1) {
			this.pageNumber = 1;
			this.setRecordsToDisplay();
		} else {
			if (event.detail.target.value > this.totalPages) {
				this.pageNumber = this.totalPages;
			} else {
				this.pageNumber = event.detail.target.value;
			}

			this.setRecordsToDisplay();
		}
	}

	@api search(event) {
		console.log("event.detail", event.detail.target.value);

		let searchKey = "";
		this.pageNumber = 1;
		this.searchKey = searchKey;

		if (event.detail.target.value) {
			this.searchKey = event.detail.target.value;
		} else {
			this.searchKey = "";
		}

		this.searchItems = this.totalRecords_.filter((rec) => {
			let obj = {};
			obj = { ...rec };
			this.fieldsNotUseInSearch.forEach((field) => {
				obj[field] = "";
			});

			for (let value of Object.values(obj)) {
				if (value) {
					if (String(value).toLowerCase().includes(this.searchKey.toLowerCase())) {
						return true;
					}
				}
			}
		});

		this.setRecordsToDisplay();
	}

	@api handleRecordsPerPage(event) {
		this.spinner_ = true;
		this.pageNumber = 1;
		this.optionValue = Number(event.detail.detail.value);
		this.pageSize = event.detail.target.value;
		this.setRecordsToDisplay();
		this.updatePaginatorState();
	}

	@api updatePaginatorState() {
		let state = {
			pageNumber: this.pageNumber,
			totalPages: this.totalPages,
			recordsLength: this.bufferRecords?.length,
			currentLength: this.recordsToDisplay?.length
		};

		this.dispatchEvent(
			new CustomEvent("updatepaginatorstateevent", {
				detail: state
			})
		);
	}

	@api clear() {
		this.preSelectedRows = { 1: [] };
		this.selectedItems_ = new Set();
		this.searchKey = "";
		this.pageNumber = 1;
		this.setRecordsToDisplay();
		this.updatePaginatorState();
	}

	calculatePreSelectedRows() {
		let prRows = [];
		for (let row of this.template.querySelector("lightning-datatable")?.getSelectedRows()) {
			prRows.push(row["Id"]);
		}
		this.preSelectedRows[this.pageNumber] = prRows;
	}

	onRowSelection(event) {
		//?? when we change recordsToDisplay state
		//?? sometimes onRowSelection trigger incorrectly
		if (this.mistakenFire) {
			return;
		}

		let selectedItemsLocal = this.getPreSelectedItemsOnCurrentPage(event);

		if (this.searchKey) {
			this.handleSearchPreSelect(selectedItemsLocal);
		} else {
			this.handlePreSelect(selectedItemsLocal);
		}

		this.sendSelectedIdsEvent();
	}

	sendSelectedIdsEvent() {
		let state = {
			selectedItemsIds: this.preSelRows
		};

		this.dispatchEvent(
			new CustomEvent("selecteditemsevent", {
				detail: state
			})
		);
	}

	// the hook that is responsible for processing the buttons
	onRowAction(event) {
		const rowActionEvent = new CustomEvent("rowactionevent", {
			detail: event
		});
		this.dispatchEvent(rowActionEvent);
	}

	handleSearchPreSelect(selectedItemsLocal) {
		const recordIdsFromCurrentPage = new Set();

		// add to recordIdsFromCurrentPage all items ids
		this.recordsToDisplay.forEach((item) => {
			recordIdsFromCurrentPage.add(item.Id);
		});

		const unselectedRecordIds = [...recordIdsFromCurrentPage].filter((Id) => {
			return selectedItemsLocal.every((item) => item !== Id);
		});

		[...this.selectedItems].forEach((Id) => {
			let shouldDelete = unselectedRecordIds.some((item) => item === Id);
			shouldDelete ? this.selectedItems.delete(Id) : null;
		});
	}

	handlePreSelect(selectedItemsLocal) {
		for (let item of [...this.selectedItems]) {
			let hasItem = selectedItemsLocal.every((elem) => elem !== item);
			if (hasItem) {
				this.selectedItems.delete(item);
			}
		}
	}

	getPreSelectedItemsOnCurrentPage(event) {
		let selRows = [];
		let selectedItemsLocal = [];
		const selectedRows = event.detail.selectedRows;
		for (let i = 0; i < selectedRows.length; i++) {
			selRows.push(selectedRows[i].Id);
		}

		let tablePreselectedRows = JSON.parse(JSON.stringify(this.preSelectedRows));

		tablePreselectedRows[this.pageNumber] = selRows;

		for (const [key, value] of Object.entries(tablePreselectedRows)) {
			selectedItemsLocal.push.apply(selectedItemsLocal, value);
		}

		selectedItemsLocal.map((item) => {
			if (!this.selectedItems.has(item)) {
				this.selectedItems.add(item);
			}
		});
		return selectedItemsLocal;
	}

	updateColumnSorting(event) {
		try {
			this.spinner_ = true;

			let fieldName = event.detail.fieldName;

			fieldName = this.sortedNameCorrection.hasOwnProperty(fieldName)
				? this.sortedNameCorrection[fieldName]
				: fieldName;

			let sortDirection = event.detail.sortDirection;
			this.sortedBy = fieldName;
			this.sortedDirection = sortDirection;
			let reverse = sortDirection !== "asc";
			let data_clone;
			if (this.searchKey !== "") {
				data_clone = JSON.parse(JSON.stringify(this.searchItems));
				this.searchItems = data_clone.sort(this.sortData(fieldName, reverse));
			} else {
				data_clone = JSON.parse(JSON.stringify(this.totalRecords_));
				this.totalRecords_ = data_clone.sort(this.sortData(fieldName, reverse));
			}

			// keep this line at the end to reset the name field back to url so we get the sort directions.
			this.sortedBy = event.detail.fieldName;

			this.setRecordsToDisplay();
		} catch (error) {
			console.log(error);
		}
	}

	sortData(field, reverse, primer) {
		var key = function (x) {
			return primer ? primer(x[field]) : x[field];
		};
		return function (a, b) {
			var A = key(a),
				B = key(b);
			if (A === undefined) A = "";
			if (B === undefined) B = "";
			return (A < B ? -1 : A > B ? 1 : 0) * [1, -1][+!!reverse];
		};
	}

	setStyleVariables() {
		console.log("setStyleVariables");
	}
	setTableStyleVariables() {
		let defaultParams = {
			//?? Custom variable load by static resources
			textFontSize: 14,
			textFontColor: "rgb(136, 139, 141)",
			headerFontSize: 15,
			hoverBackgroundColor: "rgba(136, 139, 141, 0.14)",

			//?? Local variables
			heightDatatable: null,

			//?? Primary color of link
			brandTextLink: "rgb(136, 139, 141)",
			colorTextLinkPrimaryFocus: "rgb(136, 139, 141)",
			colorTextLinkPrimaryHover: "rgb(237, 139, 0)",
			brandTextLinkActive: "rgb(237, 139, 0)",
			colorTextLinkActive: "rgb(237, 139, 0)",

			//?? Header
			tableColorTextHeader: "rgb(237, 139, 0)",
			tableColorBackgroundHeader: "rgb(250, 250, 249)",
			tableColorBackgroundHeaderHover: "rgb(255, 255, 255)",
			tableColorBackgroundHeaderResizableHandle: "rgba(255, 255, 255,0)",
			headerBottomBorderColor: "rgb(237, 139, 0)",

			//?? Rows
			colorBackgroundAlt: "rgb(255, 255, 255)",
			colorBackgroundRowHover: "rgba(136, 139, 141, 0.05)",
			colorBorder: "rgb(255, 255, 255)",
			colorTextDefault: "rgb(136, 139, 141)",

			//?? Primary colors brand, destructive
			colorBorderDestructiveHover: "rgb(166, 26, 20)",
			colorBackgroundDestructiveHover: "rgb(166, 26, 20)",
			colorBackgroundDestructiveActive: "rgb(135, 5, 0)",
			colorTextDestructive: "rgb(194, 57, 52)",
			brandAccessibleActive: "rgb(255, 255, 255)",
			buttonBrandTextColorHover: "rgb(237, 139, 0)",
			brandAccessible: "rgb(237, 139, 0)",
			brandPrimaryActive: "rgb(237, 139, 0)",
			buttonColorBorderPrimary: "rgb(237, 139, 0)",
			colorBackgroundButtonDefaultHover: "rgb(237, 139, 0)",
			//?? Checkbox color
			colorBorderInputCheckboxSelectedCheckmark: "rgb(255, 255, 255)",
			colorBorderInput: "rgb(237, 139, 0)",
			colorBorderInputDisabled: "rgb(201, 199, 197)",
			borderWidthThin: 1,
			shadowButtonFocus: "rgba(255, 255, 255, 0)"
		};
		this.defaultParams = defaultParams;

		//!! this comment hor future improvements
		// let keyAttributes = {
		//   textFontSize: "--text-font-size",
		//   textFontColor: "--text-font-color",
		//   headerFontSize: "--header-font-size",
		//   hoverBackgroundColor: "--hover-background-color",
		//   brandTextLink: "--lwc-brandTextLink",
		//   colorTextLinkPrimaryFocus: "--lwc-colorTextLinkPrimaryFocus",
		//   colorTextLinkPrimaryHover: "--lwc-colorTextLinkPrimaryHover",
		//   brandTextLinkActive: "--lwc-brandTextLinkActive",
		//   colorTextLinkActive: "--lwc-colorTextLinkActive",
		//   tableColorTextHeader: "--lwc-tableColorTextHeader",
		//   tableColorBackgroundHeader: "--lwc-tableColorBackgroundHeader",
		//   tableColorBackgroundHeaderHover: "--lwc-tableColorBackgroundHeaderHover",
		//   tableColorBackgroundHeaderResizableHandle:
		//     "--lwc-tableColorBackgroundHeaderResizableHandle",
		//   headerBottomBorderColor: "--header-bottom-border-color",
		//   colorBackgroundAlt: "--lwc-colorBackgroundAlt",
		//   colorBackgroundRowHover: "--lwc-colorBackgroundRowHover",
		//   colorBorder: "--lwc-colorBorder",
		//   colorTextDefault: "--lwc-colorTextDefault",
		//   colorBorderDestructiveHover: "--lwc-colorBorderDestructiveHover",
		//   colorBackgroundDestructiveHover: "--lwc-colorBackgroundDestructiveHover",
		//   colorBackgroundDestructiveActive: "--lwc-colorBackgroundDestructiveActive",
		//   colorTextDestructive: "--lwc-colorTextDestructive",
		//   brandAccessibleActive: "--lwc-brandAccessibleActive",
		//   buttonBrandTextColorHover: "--sds-c-button-brand-text-color-hover",
		//   brandAccessible: "--lwc-brandAccessible",
		//   brandPrimaryActive: "--lwc-brandPrimaryActive",
		//   buttonColorBorderPrimary: "--lwc-buttonColorBorderPrimary",
		//   colorBackgroundButtonDefaultHover: "--lwc-colorBackgroundButtonDefaultHover",
		//   colorBorderInputCheckboxSelectedCheckmark:
		//     "--lwc-colorBorderInputCheckboxSelectedCheckmark",
		//   colorBorderInput: "--lwc-colorBorderInput",
		//   colorBorderInputDisabled: "--lwc-colorBorderInputDisabled",
		//   borderWidthThin: "--lwc-borderWidthThin",
		// shadowButtonFocus: "--lwc-shadowButtonFocus"

		// };

		let table = this.template.querySelector(".custom-datatable");

		//!! style load by static recurses start
		table.style.setProperty(
			"--text-font-size",
			this.styleParameters.hasOwnProperty("textFontSize")
				? this.styleParameters.textFontSize + "px"
				: defaultParams.textFontSize + "px"
		);

		table.style.setProperty(
			"--text-font-color",
			this.styleParameters.hasOwnProperty("textFontColor")
				? this.styleParameters.textFontColor
				: defaultParams.textFontColor
		);

		table.style.setProperty(
			"--header-font-size",
			this.styleParameters.hasOwnProperty("headerFontSize")
				? this.styleParameters.headerFontSize + "px"
				: defaultParams.headerFontSize + "px"
		);

		table.style.setProperty(
			"--hover-background-color",
			this.styleParameters.hasOwnProperty("hoverBackgroundColor")
				? this.styleParameters.hoverBackgroundColor
				: defaultParams.hoverBackgroundColor
		);

		//?? primary color of link

		table.style.setProperty(
			"--lwc-brandTextLink",
			this.styleParameters.hasOwnProperty("brandTextLink")
				? this.styleParameters.brandTextLink
				: defaultParams.brandTextLink
		);

		table.style.setProperty(
			"--lwc-colorTextLinkPrimaryFocus",
			this.styleParameters.hasOwnProperty("colorTextLinkPrimaryFocus")
				? this.styleParameters.colorTextLinkPrimaryFocus
				: defaultParams.colorTextLinkPrimaryFocus
		);

		table.style.setProperty(
			"--lwc-colorTextLinkPrimaryHover",
			this.styleParameters.hasOwnProperty("colorTextLinkPrimaryHover")
				? this.styleParameters.colorTextLinkPrimaryHover
				: defaultParams.colorTextLinkPrimaryHover
		);

		table.style.setProperty(
			"--lwc-brandTextLinkActive",
			this.styleParameters.hasOwnProperty("brandTextLinkActive")
				? this.styleParameters.brandTextLinkActive
				: defaultParams.brandTextLinkActive
		);

		table.style.setProperty(
			"--lwc-colorTextLinkActive",
			this.styleParameters.hasOwnProperty("colorTextLinkActive")
				? this.styleParameters.colorTextLinkActive
				: defaultParams.colorTextLinkActive
		);

		//??header
		table.style.setProperty(
			"--lwc-tableColorTextHeader",
			this.styleParameters.hasOwnProperty("tableColorTextHeader")
				? this.styleParameters.tableColorTextHeader
				: defaultParams.tableColorTextHeader
		);

		table.style.setProperty(
			"--lwc-tableColorBackgroundHeader",
			this.styleParameters.hasOwnProperty("tableColorBackgroundHeader")
				? this.styleParameters.tableColorBackgroundHeader
				: defaultParams.tableColorBackgroundHeader
		);

		table.style.setProperty(
			"--lwc-tableColorBackgroundHeaderHover",
			this.styleParameters.hasOwnProperty("tableColorBackgroundHeaderHover")
				? this.styleParameters.tableColorBackgroundHeaderHover
				: defaultParams.tableColorBackgroundHeaderHover
		);

		table.style.setProperty(
			"--lwc-tableColorBackgroundHeaderResizableHandle",
			this.styleParameters.hasOwnProperty("tableColorBackgroundHeaderResizableHandle")
				? this.styleParameters.tableColorBackgroundHeaderResizableHandle
				: defaultParams.tableColorBackgroundHeaderResizableHandle
		);

		table.style.setProperty(
			"--header-bottom-border-color",
			this.styleParameters.hasOwnProperty("headerBottomBorderColor")
				? this.styleParameters.headerBottomBorderColor
				: defaultParams.headerBottomBorderColor
		);

		//!!rows
		table.style.setProperty(
			"--lwc-colorBackgroundAlt",
			this.styleParameters.hasOwnProperty("colorBackgroundAlt")
				? this.styleParameters.colorBackgroundAlt
				: defaultParams.colorBackgroundAlt
		);

		table.style.setProperty(
			"--lwc-colorBackgroundRowHover",
			this.styleParameters.hasOwnProperty("colorBackgroundRowHover")
				? this.styleParameters.colorBackgroundRowHover
				: defaultParams.colorBackgroundRowHover
		);

		table.style.setProperty(
			"--lwc-colorBorder",
			this.styleParameters.hasOwnProperty("colorBorder")
				? this.styleParameters.colorBorder
				: defaultParams.colorBorder
		);

		table.style.setProperty(
			"--lwc-colorTextDefault",
			this.styleParameters.hasOwnProperty("colorTextDefault")
				? this.styleParameters.colorTextDefault
				: defaultParams.colorTextDefault
		);

		//!!primary colors brand, destructive
		table.style.setProperty(
			"--lwc-colorBorderDestructiveHover",
			this.styleParameters.hasOwnProperty("colorBorderDestructiveHover")
				? this.styleParameters.colorBorderDestructiveHover
				: defaultParams.colorBorderDestructiveHover
		);

		table.style.setProperty(
			"--lwc-colorBackgroundDestructiveHover",
			this.styleParameters.hasOwnProperty("colorBackgroundDestructiveHover")
				? this.styleParameters.colorBackgroundDestructiveHover
				: defaultParams.colorBackgroundDestructiveHover
		);

		table.style.setProperty(
			"--lwc-colorBackgroundDestructiveActive",
			this.styleParameters.hasOwnProperty("colorBackgroundDestructiveActive")
				? this.styleParameters.colorBackgroundDestructiveActive
				: defaultParams.colorBackgroundDestructiveActive
		);

		table.style.setProperty(
			"--lwc-colorTextDestructive",
			this.styleParameters.hasOwnProperty("colorTextDestructive")
				? this.styleParameters.colorTextDestructive
				: defaultParams.colorTextDestructive
		);

		table.style.setProperty(
			"--lwc-brandAccessibleActive",
			this.styleParameters.hasOwnProperty("brandAccessibleActive")
				? this.styleParameters.brandAccessibleActive
				: defaultParams.brandAccessibleActive
		);

		table.style.setProperty(
			"--sds-c-button-brand-text-color-hover",
			this.styleParameters.hasOwnProperty("buttonBrandTextColorHover")
				? this.styleParameters.buttonBrandTextColorHover
				: defaultParams.buttonBrandTextColorHover
		);

		table.style.setProperty(
			"--lwc-brandAccessible",
			this.styleParameters.hasOwnProperty("brandAccessible")
				? this.styleParameters.brandAccessible
				: defaultParams.brandAccessible
		);

		table.style.setProperty(
			"--lwc-brandPrimaryActive",
			this.styleParameters.hasOwnProperty("brandPrimaryActive")
				? this.styleParameters.brandPrimaryActive
				: defaultParams.brandPrimaryActive
		);

		table.style.setProperty(
			"--lwc-buttonColorBorderPrimary",
			this.styleParameters.hasOwnProperty("buttonColorBorderPrimary")
				? this.styleParameters.buttonColorBorderPrimary
				: defaultParams.buttonColorBorderPrimary
		);

		table.style.setProperty(
			"--lwc-colorBackgroundButtonDefaultHover",
			this.styleParameters.hasOwnProperty("colorBackgroundButtonDefaultHover")
				? this.styleParameters.colorBackgroundButtonDefaultHover
				: defaultParams.colorBackgroundButtonDefaultHover
		);

		table.style.setProperty("--lwc-shadowButtonFocus", "0 0 0px rgb(136, 139, 141)");

		//!checkbox color
		table.style.setProperty(
			"--lwc-colorBorderInputCheckboxSelectedCheckmark",
			this.styleParameters.hasOwnProperty("colorBorderInputCheckboxSelectedCheckmark")
				? this.styleParameters.colorBorderInputCheckboxSelectedCheckmark
				: defaultParams.colorBorderInputCheckboxSelectedCheckmark
		);

		table.style.setProperty(
			"--lwc-colorBorderInput",
			this.styleParameters.hasOwnProperty("colorBorderInput")
				? this.styleParameters.colorBorderInput
				: defaultParams.colorBorderInput
		);

		table.style.setProperty(
			"--lwc-colorBorderInputDisabled",
			this.styleParameters.hasOwnProperty("colorBorderInputDisabled")
				? this.styleParameters.colorBorderInputDisabled
				: defaultParams.colorBorderInputDisabled
		);

		table.style.setProperty(
			"--lwc-borderWidthThin",
			this.styleParameters.hasOwnProperty("borderWidthThin")
				? this.styleParameters.borderWidthThin
				: defaultParams.borderWidthThin + "px"
		);
	}

	//* getters and setters

	@api
	get totalRecords() {
		if (!this.stylesLoaded) {
			return [];
		}
		return this.totalRecords_;
	}

	set totalRecords(value) {
		console.log("totalRecords", value);

		this.totalRecords_ = value;
		this.showTable = true;
		this.setRecordsToDisplay();
	}

	@api
	get preSelRows() {
		return Array.from(this.selectedItems);
	}

	@api
	get selectedItems() {
		return this.selectedItems_;
	}

	set selectedItems(value) {
		this.selectedItems_ = value;
	}

	@api
	get spinner() {
		return this.spinner_;
	}

	set spinner(value) {
		console.log("spinner", value);
		this.spinner_ = value;
	}

	get tableHeight() {
		return this.styleParameters.hasOwnProperty("heightDatatable")
			? "height:" + this.styleParameters.heightDatatable + "px"
			: "";
	}

	get isLoadedStyle() {
		if (!this.stylesLoaded) {
			return "notLoaded";
		}
		return "loaded";
	}

	get datatableClass() {
		return this.customTableName + " custom-datatable slds-table_striped";
	}
}
