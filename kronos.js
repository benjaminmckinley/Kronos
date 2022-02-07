// kronos.js

/* global variables */
var maxRecent = 10;


/*
 * Setup events on popup creation.
 */
window.onload = async function() {
  /*** tab state logic ***/
  let tab = await getCurrentTab();
  let title = await chrome.action.getTitle({tabId: tab.id});

  let address = await chrome.storage.sync.get(['user_inbox_address']);
  address = address.user_inbox_address;

  //storing state via the set tab title
  if (title != '' && address != '') {
    await sendCurrentTab();
    await chrome.action.setTitle({tabId: tab.id, title: ''});
  }

  /*** popup configure ***/

  /* initial setup */
  fillInboxAddress();

  /* button functionality */
  document.getElementById('send-button').onclick = sendCurrentTab;
  document.getElementById('address-input').onchange = saveInboxAddress;
  document.getElementById('info-button').onclick = infoAlert;
  document.getElementById('title').onclick = showRecents;
};

/*
 * Save the inbox address to synced chrome storage.
 */
saveInboxAddress = function() {
  let input = document.getElementById('address-input').value;

  if (input != undefined) {
    chrome.storage.sync.set({user_inbox_address: input});
  }
}

/*
 * Load the inbox address from synced chrome storage
 * and set in popup if defined.
 */
fillInboxAddress = function() {
  chrome.storage.sync.get(['user_inbox_address'], function(result) {
    if (result.user_inbox_address != undefined) {
      document.getElementById('address-input').value = result.user_inbox_address;
    }
  });
}

/*
 * Display usage information alert.
 */
infoAlert = function() {
  alert(chrome.i18n.getMessage("info_message"));
}

/*
 * Send current tab url to the inbox address and update icon to indicate status.
 * Add to list of recently saved.
 */
sendCurrentTab = async function() {

  let address = await chrome.storage.sync.get(['user_inbox_address']);
  address = address.user_inbox_address;

  if (address == '') {
    alert("No inbox specified");
    return;
  }

  let tab = await getCurrentTab();
  let url = tab.url;

  updateRecentList(url);

  await chrome.action.setIcon({
    tabId: tab.id,
    path: "res/icons/kronos_saved_icon16.png"
  });

  chrome.tabs.create({url: address + url});
}

/*
 * Show list of recents dropdown on popup.
 */
showRecents = function() {
  chrome.storage.sync.get('recent_list', function(result) {
    let recents = result.recent_list;

    let listContainer = document.getElementById('recents');
    listContainer.style.display = 'inline';

    if (!isNaN(recents.length)) {

      let contents = '<ol>';
      recents.forEach((url) => {
        contents = contents + '<li><a href="' + url + '">' + url + '</a></li>'
      });

      contents = contents + '</ol>'
      listContainer.innerHTML = contents;
    }
  });
}

/*
 * Add param url to recent list in synced chrome storage.
 */
updateRecentList = function(url) {
  chrome.storage.sync.get('recent_list', function(result) {
      let recents = result.recent_list;

      if (recents == undefined) recents = [];

      recents.unshift(url);

      if (recents.length > maxRecent) recents.pop();

      chrome.storage.sync.set({recent_list: recents});
  });
}

/*
 * Query and return current Tab object.
 */
getCurrentTab = async function() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}
