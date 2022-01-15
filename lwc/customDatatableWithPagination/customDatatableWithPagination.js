import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import Id from '@salesforce/user/Id';

//load records and column name
import getData from '@salesforce/apex/CustomTableController.getTableData';

// custom logic

export default class CompletedSchoolHealthIndexTable extends NavigationMixin(LightningElement) {
    //main table name
    @api tableLabel;
    @api bigLabelFontSize;
    @api bigLabelFontColor;

    @api wrapperPadding;
    @api wrapperBorderColor;

    @api headerColor;
    @api separatorColor;
    @api deleteButtonColor;
    @api defaultPageSize;
    @api showingRecordsPlaceholder;

    // paginator variables
    @api inputPlaceholder;
    @api enableSearch;
    @api controlsTextColor = 'rgb(27, 339, 0)';

    // paginator color variables
    @api searchBorder;
    @api searchInputColor;
    @api recordsPerPageSelectorColor;
    @api recordsPerPageSelectorBorder;
    @api footerInputPaginationColor;
    @api footerInputPaginationBorder;

    //?? datatable Api variables

    @api enablePagination;

    // * datatable variables
    @api showRowNumberColumn;

    //* style params

    @api textFontSize;
    @api textFontColor;

    //* subheading on datatable
    @api labelFontSize;
    @api labelFontColor;

    //*
    @api tableBackgroundColor;
    @api hoverBackgroundColor;

    //*
    @api subheaderUnderline;

    //* buttons
    @api primaryButtonLabel = '';
    @api secondaryButtonLabel = '';

    @api primaryButtonBackgroundColor;
    @api secondaryButtonBackgroundColor;
    //*
    @api checkboxColor;

    @track tableParams = {};
    @track paginatorStyleParams = {};

    @track columns = [];
    @track retrievedRecordsLength;
    @track retrievedRecords;

    // init variables
    @track showTable = false;
    @track pageNumber = 1;
    @track totalPages;
    @track recordsLength;
    @track currentLength;
    @track spinner = false;

    @track selectedItemsIds;
    hidePagination = false;
    hideSearch = false;

    //* custom logic variable
    userId = Id;
    baseUrl;

    //!! available flags
    paginationEnabled = true;

    // by default search works on all fields
    // fieldsNotUseInSearch is determine which column search is remove
    // recommended Id, rowNumber
    fieldsNotUseInSearch = ['Id', 'rowNumber', 'customURL'];

    // // pass next variable if you need correction URL column name
    // sortedNameCorrection = { customURL: "Name" };
    sortedNameCorrection = {};

    connectedCallback() {
        this.paginatorStyleParams = {
            searchInputColor: this.searchInputColor,
            searchBorder: this.searchBorder,
            footerPaginationColor: this.controlsTextColor,
            footerInputPaginationBorder: this.footerInputPaginationBorder,
            footerInputPaginationColor: this.footerInputPaginationColor,
            recordsPerPageBorder: this.recordsPerPageSelectorBorder,
            recordsPerPageColor: this.recordsPerPageSelectorColor,
            recordsPerPageSideTextColor: this.controlsTextColor
        };

        try {
            let urlString = window.location.href;
            this.baseUrl = urlString.substring(0, urlString.indexOf('/s'));

            this.loadData();

            this.tableParams = {
                textFontSize: this.textFontSize,
                textFontColor: this.textFontColor,
                headerFontSize: this.labelFontSize,
                tableColorTextHeader: this.labelFontColor,
                brandTextLink: this.textFontColor,
                brandTextLinkActive: this.primaryButtonBackgroundColor,
                headerBottomBorderColor: this.subheaderUnderline,
                colorBackgroundAlt: this.tableBackgroundColor,
                hoverBackgroundColor: this.hoverBackgroundColor,
                tableColorBackgroundHeader: this.tableBackgroundColor,
                tableColorBackgroundHeaderHover: this.tableBackgroundColor,
                brandAccessible: this.primaryButtonBackgroundColor,
                buttonBrandTextColorHover: this.primaryButtonBackgroundColor,
                buttonColorBorderPrimary: this.secondaryButtonBackgroundColor,
                colorBackgroundButtonDefaultHover: this.secondaryButtonBackgroundColor,
                colorBorderInput: this.checkboxColor
            };
        } catch (error) {
            console.log(error);
        }
    }

    renderedCallback() {
        try {
            this.setStyle();
        } catch (error) {
            console.log(error);
        }
    }

    loadData() {
        this.spinner = true;
        getData()
            .then((result) => {
                console.log('result', result);

                this.getColumn(result?.fieldSets);
                this.getRecords(result?.records, result?.fieldSets);

                if (result?.records?.length > 0) {
                    this.showTable = true;
                    this.hidePagination = false;
                    this.hideSearch = false;
                } else {
                    this.showTable = false;
                    this.hidePagination = true;
                    this.hideSearch = true;
                }
            })
            .catch((error) => {
                console.log(error);
            })
            .finally(() => {
                this.spinner = false;
            });
    }

    getColumn(fieldSets) {
        this.columns = [];
        for (let i = 0; i < fieldSets.length; i++) {
            let col = {
                label: fieldSets[i].Display_Label__c,
                fieldName: fieldSets[i].Field_API_Name__c.split('.').join(''),
                type: 'text',
                hideDefaultActions: true,
                sortable: true
            };
            this.columns.push(col);
        }

        // define custom buttons
        this.columns.push({
            type: 'button',
            fixedWidth: 165,
            typeAttributes: {
                label: this.secondaryButtonLabel,
                name: 'secondary',
                title: this.secondaryButtonLabel,
                disabled: false,
                iconPosition: 'right'
            }
        });

        this.columns.push({
            type: 'button',
            fixedWidth: 100,
            typeAttributes: {
                label: this.primaryButtonLabel,
                name: 'primary',
                variant: 'brand',
                title: this.primaryButtonLabel,
                disabled: false,
                iconPosition: 'right'
            }
        });
    }

    getRecords(data, fieldSets) {
        let recs = [];
        if (data?.length > 0) {
            for (let i = 0; i < data.length; i++) {
                let aff = {};
                aff.rowNumber = '' + (i + 1);
                for (let field of fieldSets) {
                    let singleLine = data[i];
                    let stringFields = field.Field_API_Name__c.split('.');
                    for (let stringField of stringFields) {
                        try {
                            singleLine = singleLine[stringField];
                        } catch (exception) {
                            singleLine = '';
                        }
                    }

                    aff[stringFields.join('')] = singleLine;
                    aff.Id = data[i].Id;
                    aff.customURL = this.baseUrl + '/s/account/' + data[i].Id;
                }
                recs.push(aff);
            }
            this.retrievedRecordsLength = recs.length;
            this.retrievedRecords = recs;
        } else {
            this.retrievedRecordsLength = 0;
            this.retrievedRecords = [];
        }
    }

    rowActionHandler(event) {
        this.spinner = true;

        this.log('rowActionHandler', event);
        const actionName = event.detail?.detail?.action?.name;
        console.log('actionName', actionName);
        const row = event.detail.detail.row;
        const url2 = this.baseUrl + '/s/account/' + row.Id;

        switch (actionName) {
            case 'secondary':
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: {
                        url: url2
                    }
                });

                this.spinner = false;

                break;
            case 'primary':
                this.log('primary', row);

                deleteRecord(row['Id'])
                    .then((result) => {
                        const payload = { status: 'update' };
                        refreshApex(this.loadData());
                        this.showSuccessNotification('Success delete', 'success');
                    })
                    .catch((error) => {
                        console.log('error');
                        console.log(error);
                    })
                    .finally(() => {
                        this.clear();
                        this.spinner = false;
                    });

                break;
            default:
        }
    }

    selectedItemsHandler(event) {
        this.selectedItemsIds = event.detail.selectedItemsIds;
        console.log('selected items ', JSON.stringify(this.selectedItemsIds));
    }

    //!!--- pagination methods are paged to datatable
    //!! just copy paste

    previousPageHandler() {
        this.template.querySelector('c-custom-datatable').previousPageHandler();
    }

    pageNumberChangeHandler(event) {
        console.log('pageNumberChangeHandler');
        this.template.querySelector('c-custom-datatable').pageNumberChangeHandler(event);
    }

    nextPageHandler() {
        this.template.querySelector('c-custom-datatable').nextPageHandler();
    }

    handleRecordsPerPage(event) {
        this.template.querySelector('c-custom-datatable').handleRecordsPerPage(event);
    }

    search(event) {
        try {
            this.template.querySelector('c-custom-datatable').search(event);
        } catch (error) {
            console.log(error);
        }
    }

    // clear preselected items on datatable
    clear() {
        this.template.querySelector('c-custom-datatable').clear();
    }

    // receive from datatable
    // method which update paginator state
    // note that the first trigger method and only after assign variables

    updatePaginatorState(event) {
        this.pageNumber = event.detail.pageNumber;
        this.totalPages = event.detail.totalPages;
        this.recordsLength = event.detail.recordsLength;
        this.currentLength = event.detail?.currentLength;
        console.log('this.recordsLength', this.recordsLength);
        this.log('event.detail', event.detail);
        // console.log(event.detail);
        this.template.querySelector('c-custom-paginator').setPaginationControls();
    }

    setStyle() {
        let label = this.template?.querySelector('.table-label');

        label?.style.setProperty('--label-font-size', this.bigLabelFontSize + 'px');
        label?.style.setProperty('--label-font-color', this.bigLabelFontColor);

        let tableWrapper = this.template?.querySelector('.table-wrapper');
        tableWrapper?.style.setProperty('--table-background-color', this.tableBackgroundColor);
        tableWrapper?.style.setProperty('--table-border-background-color', this.wrapperBorderColor);
        tableWrapper?.style.setProperty('--text-font-size', this.textFontSize + 'px');
        tableWrapper?.style.setProperty('--text-font-color', this.textFontColor);
        tableWrapper?.style.setProperty('--separator-color', this.separatorColor);

        let tableResponsive = this.template.querySelector('.table-responsive');
        tableResponsive?.style.setProperty('--wrapper-border-color', this.wrapperBorderColor);
        tableResponsive?.style.setProperty('--wrapper-padding', this.wrapperPadding + 'px');
        tableResponsive?.style.setProperty('--header-color', this.headerColor);
        tableResponsive?.style.setProperty('--separator-color', this.separatorColor);
    }

    //* custom logic methods

    //?? Help functions

    showSuccessNotification(message, variant) {
        const evt = new ShowToastEvent({
            title: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    showErrorNotification(message, description) {
        const evt = new ShowToastEvent({
            title: message,
            message: description,
            variant: 'error'
        });
        this.dispatchEvent(evt);
    }

    log(message, object) {
        console.log('%c ' + message + '! ==> ', 'background: #222; color: #bada55', JSON.parse(JSON.stringify(object)));
    }

    //* getters and setters

    get showHeaderButton() {
        if (this.selectedItemsIds?.length > 0) {
            return true;
        }
        return false;
    }
}
