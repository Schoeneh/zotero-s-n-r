var fieldName = prompt("In welchem Feld soll gesucht werden?\n\nFür eine Liste aller möglichen Felder:\nhttps://api.zotero.org/itemFields?pprint=1", "title");
var search = prompt("Welche Zeichen/Wörter sollen gesucht werden?", "Foo");
var replace = prompt("Durch welche Zeichen/Wörter soll es ersetzt werden?", "Foobar");

// Search
var fieldID = Zotero.ItemFields.getID(fieldName);
var s = new Zotero.Search();
s.libraryID = ZoteroPane.getSelectedLibraryID();
s.addCondition(fieldName, 'contains', search);
var ids = await s.search();
// Zotero search 'contains' is case insensitive - results need to be filtered again
var idsCorrect = [];
for (let id of ids) {
    var item = await Zotero.Items.getAsync(id);
    var fieldValue = item.getField(fieldName);
    if (fieldValue.includes(search)) {
        idsCorrect.push(id);
    }
}

if (!idsCorrect.length) {return "No items found";}
// Preview of Edit
else {
    var previewItem = await Zotero.Items.getAsync(idsCorrect[0]);
    let previewOldValue = previewItem.getField(fieldName);
    let previewNewValue = previewOldValue.replace(search, replace);
    var confirmed = confirm(idsCorrect.length + " item(s) found" + "\n\n" +
    "Old:\n" + previewItem.getField(fieldName) + "\n" + "New:\n" + previewNewValue);
}

// Replace
if (confirmed == true) {
    await Zotero.DB.executeTransaction(async function () {
        for (let id of idsCorrect) {
            let item = await Zotero.Items.getAsync(id);
            let mappedFieldID = Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, fieldName);
            let oldValue = item.getField(fieldName);
            let newValue = oldValue.replace(search, replace);
            item.setField(mappedFieldID ? mappedFieldID : fieldID, newValue);
            await item.save();
        }
    });
    alert(idsCorrect.length + " item(s) updated");
}
