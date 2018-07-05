
// register a service worker if the browser supports it.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./index.js');
}

const allCurrenciesUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
let baseAmount = 1;

//create the currency convertor indexedDB database to store queried currencies' exchange rates.
const dbPromise = idb.open('currency-convertor', 1, upgradeDb => {
  switch (upgradeDb.oldVersion) {
    case 0:
      let currencyStore = upgradeDb.createObjectStore('currencyRates', { keyPath: 'currencyQuery' });
  }
});

// API call to fetch all currencies and insert them into the SELECT tags.
fetch(allCurrenciesUrl).then(response => {
  const currencies = response.json();
  return currencies;
}).then(currenciesData => {
  const allCurr = currenciesData.results;
  for (let [key, value] of Object.entries(allCurr)){
    const selectTags = document.querySelectorAll('select');
    for (tag of selectTags){
      let currencyText = `${value.id} - ${value.currencyName}`;
      let currencyVal = `${value.id}`;
      let createdOption = document.createElement('OPTION');
      let createdOptionValue = document.createTextNode(currencyText);
      createdOption.setAttribute('value', currencyVal);
      createdOption.appendChild(createdOptionValue);
      tag.insertBefore(createdOption, tag.lastChild);
    }
  }
  return currenciesData.results;
});

let form = document.querySelector('form');

// if a user submits the form, return the base currency converted to their target currency.
form.onsubmit = e => {
  let baseCurrency = document.querySelector('#base-currency').value;
  let targetCurrency = document.querySelector('#target-currency').value;
  let queryString = `${baseCurrency}_${targetCurrency}`;
  let baseAmount = document.querySelector('#base-amount').value;
  let queryUrl = `https://free.currencyconverterapi.com/api/v5/convert?q=${queryString}`;

  // Append the result of the currency conversion below the form.
  let showResult = targetVal => {
    let parentDiv = document.querySelector('#result');
    let newDiv = document.createElement('DIV');
    newDiv.innerHTML += `${baseAmount} ${baseCurrency} is equal to ${targetVal} ${targetCurrency}`;
    parentDiv.appendChild(newDiv);
    newDiv.setAttribute('class', 'alert alert-success');
    newDiv.setAttribute('role', 'alert');
    return newDiv;
  }

  // calculates the conversion give the base currency rate and amount.
  let convert = rate => {
    let targetVal = baseAmount * rate;
    return targetVal;
  }

  // Fetch exchange rate for user-given currency query.
  fetch(queryUrl).then( response => {
    myJson = response.json();
    return myJson;
  }).then(data => {
    let targetRate = data.results[queryString].val;

    // Store a copy of the queried currencies rate first, to an IDB database.
    dbPromise.then( db => {
      let tx = db.transaction('currencyRates', 'readwrite');
      let currencyRatesStore = tx.objectStore('currencyRates');

      currencyRatesStore.put({
        currencyQuery: queryString,
        rate: targetRate
      });

      return tx.complete;
    });

    showResult(convert(targetRate));

  }).catch(error => {
    // fetch currency conversion from the currency-convertor indexedDB, if there is an error.
      dbPromise.then( db => {
      let tx = db.transaction('currencyRates');
      let currencyRatesStore = tx.objectStore('currencyRates');
      console.log(`Cannot fetch a response from the network: ${error}`)
      return currencyRatesStore.get(queryString);
    }).then( exch => showResult(convert(exch.rate)) );
  });

  // prevent browser from reloading.
  e.preventDefault();
}
