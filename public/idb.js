let db;
let budgetVersion;

// Create a new db request for a "budget" database.
const request = indexedDB.open('BudgetDatabase', 1);

request.onupgradeneeded = function (event) {

  const db = event.target.result;
    db.createObjectStore('BudgetStore', { autoIncrement: true });
  };


request.onerror = function (event) {
  console.log(`Woops! Error ${event.target.errorCode}`);
};


function checkDatabase() {
  console.log('check db invoked');

  // Open a transaction on your BudgetStore db
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // access your BudgetStore object
  const store = transaction.objectStore('BudgetStore');

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // If our returned response is not empty
          //if (res.length !== 0) {
            // Open another transaction to BudgetStore with the ability to read and write
            transaction = db.transaction(['BudgetStore'], 'readwrite');
            const store = transaction.objectStore('BudgetStore');

            // Clear existing entries because our bulk add was successful
            store.clear();
            console.log('Clearing store 🧹');
          }
        );
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (data) => {
  console.log('Save record invoked');
  // Create a transaction on the BudgetStore db with readwrite access
  const transaction = db.transaction(['BudgetStore'], 'readwrite');

  // Access your BudgetStore object store
  const store = transaction.objectStore('BudgetStore');

  // Add record to your store with add method.
  store.add(data);
};

// Listen for app coming back online
window.addEventListener('online', checkDatabase);


