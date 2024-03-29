﻿function GetBehaviorSettings()
{
	return {
		"name":			"Hash",
		"id":			"Rex_bHash",
		"description":	"Access JSON structure table.",
		"author":		"Rex.Rainbow",
		"help url":		"https://dl.dropbox.com/u/5779181/C2Repo/rex_bhash.html",
		"category":		"Rex - Data structure - JSON",
		"flags":		0
	};
};

//////////////////////////////////////////////////////////////
// Conditions
AddStringParam("Key string", "The key string of the hash table.", '""');
AddCondition(1, cf_looping | cf_not_invertible, "For each item", "For Each", 
             "{my} for each item in <i>{0}</i>", "Repeat the event for each item in key.", "ForEachItem");
             
AddStringParam("Key string", "The key string of the hash table.", '""');
AddCondition(2, 0,"Key exists","Key","{my} key {0} exists","Return true if a key exists in hash table.","KeyExists");

AddStringParam("Key string", "The key string of the hash table.", '""');
AddCondition(3, 0,"Is empty","Entry","{my} entry {0} is empty","Return true if an entry is empty i.e. has no key.","IsEmpty");
             
//////////////////////////////////////////////////////////////
// Actions 
AddStringParam("Key string", "The key string of the hash table value to set.", '""');
AddAnyTypeParam("Value", "The value to store in the hash table.", 0);
AddAction(1, 0, "Set value", "Value", 
          "{my} set key <i>{0}</i> to <i>{1}</i>",
         "Set value by a key string.", "SetValueByKeyString");
         
AddStringParam("Key string", "The key string of the hash entry to get.", '""');
AddAction(2, af_deprecated, "Set current entry", "Entry", 
         "{my} get hash table entry from <i>{0}</i>",
         "Set current entry by key string.", "SetCurHashEntey");
         
AddStringParam("Key name", "The key of the hash value to set.", '""');
AddAnyTypeParam("Value", "The value to store in the hash table.", 0);
AddAction(3, af_deprecated, "Set value at current entry", "Entry", 
         "{my} set value at <i>{0}</i> to <i>{1}</i> in current entry",
         "Set value at current entry.", "SetValueInCurHashEntey");
         
AddAction(4, 0, "Clean all", "Hash table", "Clean table",
         "{my} clean table.", "CleanAll"); 
         
AddStringParam("JSON string", "JSON string.", '""');
AddAction(5, 0, "Load from JSON", "Load", 
          "{my} load content from <i>{0}</i>",
          "Load content from JSON string.", "StringToHashTable");
          
AddStringParam("Key string", "The key string of the hash table value to remove.", '""');          
AddAction(6, 0, "Remove key", "Remove", 
          "{my} remove key <i>{0}</i>",
          "Remove key.", "RemoveByKeyString");
          
AddStringParam("Key string", "The key string of the hash table.", '""');
AddObjectParam("Array", "Array instance to put result.");      
AddAction(7, 0, "Pick keys", "Keys", 
          "{my} pick keys at <i>{0}</i> into <i>{1}</i>",
          "Pick keys into an array.", "PickKeysToArray");   
          
AddObjectParam("Hash table B", "Hash table instance to merge.");  
AddComboParamOption("Overwrite from hash B");
AddComboParamOption("Merge new keys from hash table B");
AddComboParamOption("Clean then copy from hash table B");
AddComboParam("Mode", "Merge mode.",0);
AddAction(8, 0, "Merge", "Merge", 
          "{my} merge hash table with <i>{0}</i>, <i>{1}</i>",
          "Merge hash table with other hash table.", "MergeTwoHashTable");  
          
AddStringParam("Key string", "The key string of the hash table value to set.", '""');
AddStringParam("JSON", "JSON string.", '"{}"');
AddAction(9, 0, "Set JSON", "Value", 
          "{my} set key <i>{0}</i> to JSON <i>{1}</i>",
         "Set JSON by a key string.", "SetJSONByKeyString");          
         
AddStringParam("Key string", "The key string of the hash table value to add.", '""');
AddAnyTypeParam("Value", "The value to store in the hash table.", 0);
AddAction(10, 0, "Add to", "Value", 
         "{my} add <i>{1}</i> to <i>{0}</i>",
         "Add to the value of key.", "AddToValueByKeyString");         
          
AddStringParam("Key string", "The key string of the hash table value to set.", '""');
AddAction(21, 0, "Shuffle", "Array", 
          "{my} shuffle array at <i>{0}</i>",
          "Shuffle items in array.", "Shuffle");    

AddStringParam("Entry", "The entry key string of the hash table.", '""');
AddStringParam("Key", "The key string for sorting.", '""');
AddComboParamOption("descending");
AddComboParamOption("ascending");
AddComboParamOption("logical descending");
AddComboParamOption("logical ascending");
AddComboParam("Sort", "Sort method.", 1);    
AddAction(22, 0, "Sort", "Array", 
          "{my} sort array at <i>{0}</i> with key to <i>{1}</i> ( <i>{2}</i> )",
          "Sort items in array.", "Sort");        

AddStringParam("Key string", "The key string of the hash table value to set.", '""');
AddStringParam("JSON", "JSON string.", '"{}"');
AddAction(23, 0, "Push JSON", "Array", 
          "{my} push JSON <i>{1}</i> into array at <i>{0}</i> ",
          "Push JSON into array.", "PushJSON");     
          
//////////////////////////////////////////////////////////////
// Expressions
AddStringParam("Key", "The key string of the hash to get.", '""');
AddExpression(0, ef_deprecated | ef_return_any | ef_variadic_parameters, "Get value at", 
              "Value", "Hash", "Get value from the hash by key string. Add 2nd parameter to return default value when got invalid value.");
AddStringParam("Key", "The key string of the hash value to get.", '""');
AddExpression(1, ef_deprecated| ef_return_any | ef_variadic_parameters, 
              "Get value from current entry", "Entry", "Entry", 
              "Get value from current entry.");              
AddExpression(2, ef_deprecated | ef_return_string, "Transfer hash to string", 
              "JSON", "HashTableToString", "Transfer hash table to JSON string.");
AddStringParam("Key", "The key string of the hash to get.", '""');
AddExpression(3, ef_return_any | ef_variadic_parameters, "Get value at", 
              "Value", "At", "Get value from the hash by key string, return JSON string if the item is an object. Add 2nd parameter to return default value when got invalid value.");
AddExpression(4, ef_return_string, "Current key", "For Each", "CurKey", "Get the current key in a For Each loop.");
AddExpression(5, ef_return_any, "Current value", "For Each", "CurValue", "Get the current value in a For Each loop. Add 2nd parameter to return sub-item by keys. Add 3rd parameter to return default value when got invalid value.");
AddAnyTypeParam("Key", "The key of the hash to get.", '""');
AddExpression(6, ef_return_any | ef_variadic_parameters, "Get value at", 
              "Value", "AtKeys", "Get value from the hash by keys, each parameter is a key.");
AddStringParam("Key", "The key of the hash to get.", '""');
AddExpression(7, ef_return_number, "Get items count", "Items", "ItemCnt", 
              "Get item count. 0 means the item is number or string type, (-1) means the item does not exist.");              
AddAnyTypeParam("Key", "The key of the hash to get.", '""');
AddExpression(8, ef_return_number | ef_variadic_parameters, "Get items count by keys", "Items", "Keys2ItemCnt", 
              "Get item count by keys, each parameter is a key. 0 means the item is number or string type, (-1) means the item does not exist.");
AddExpression(9, ef_return_string | ef_variadic_parameters, "Transfer hash table to string", 
              "JSON", "ToString", "Create a hash table and transfer it to JSON string. If there has no parameter, transfer current hash table to JSON string.");			  
AddExpression(10, ef_return_string, "Get content as JSON string", 
              "JSON", "AsJSON", "Get content as JSON string.");
AddStringParam("Key", "The key of the hash to get.", '""');
AddExpression(11, ef_return_any | ef_variadic_parameters, "Get random key", "Key", "RandomKeyAt", 
              "Get random key in a table. Add 2nd parameter to return default value when got invalid value.");                 


ACESDone();

// Property grid properties for this plugin
var property_list = [    
    new cr.Property(ept_text, "Initial data", "", 
                   'Set initial data. ex:"{"a":10,"b":{"c":"d"}}".'),
	];
	
// Called by IDE when a new behavior type is to be created
function CreateIDEBehaviorType()
{
	return new IDEBehaviorType();
}

// Class representing a behavior type in the IDE
function IDEBehaviorType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new behavior instance of this type is to be created
IDEBehaviorType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{	
    if (this.properties["Initial data"] != "")
        var data = JSON.parse(this.properties["Initial data"]);
}
