global without sharing class CustomTableController {
	@AuraEnabled
	public static TableWrapper getTableData() {
		List<Map<String, String>> sortedFieldSets = new List<Map<String, String>>();

		// beast way to set column header is defined by metadata type
		// this is just example

		Map<String, String> name = new Map<String, String>();
		name.put('Display_Label__c', 'Name');
		name.put('Field_API_Name__c', 'Name');
		sortedFieldSets.add(Name);

		Map<String, String> amount = new Map<String, String>();
		amount.put('Display_Label__c', 'Amount');
		amount.put('Field_API_Name__c', 'Amount');
		sortedFieldSets.add(amount);

		Map<String, String> stageName = new Map<String, String>();
		stageName.put('Display_Label__c', 'Stage');
		stageName.put('Field_API_Name__c', 'StageName');
		sortedFieldSets.add(stageName);

		List<Opportunity> records = Database.query('SELECT Name, Amount, StageName  FROM Opportunity  LIMIT 300');

		TableWrapper wrapper = new TableWrapper();
		wrapper.records = records;
		wrapper.fieldSets = sortedFieldSets;

		return wrapper;
	}

	public class TableWrapper {
		@AuraEnabled
		public List<Opportunity> records;
		@AuraEnabled
		public List<Map<String, String>> fieldSets;
	}
}
