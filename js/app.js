
// register a service worker if the browser supports it.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./index.js');
}

const allCurrenciesUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';
let baseAmount = 1;

//reate the currency convertor indexedDB database to store queried currencies' exchange rates.
const dbPromise = idb.open('currency-convertor', 1, function(upgradeDb){
  switch (upgradeDb.oldVersion) {
    case 0:
      let currencyStore = upgradeDb.createObjectStore('currencyRates', { keyPath: 'currencyQuery' });
  }
});

// API call to fetch all currencies and insert them into the SELECT tags.
fetch(allCurrenciesUrl).then(function(response){
  let currencies = response.json();
  return currencies;
}).then(function(currenciesData){
  let allCurr = currenciesData.results;
  for (let [key, value] of Object.entries(allCurr)){
    let selectTags = document.querySelectorAll('select');
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
form.onsubmit = function(e){
  let baseCurrency = document.querySelector('#base-currency').value;
  let targetCurrency = document.querySelector('#target-currency').value;
  let queryString = baseCurrency + '_' + targetCurrency;
  let baseAmount = document.querySelector('#base-amount').value;
  let queryUrl = 'https://free.currencyconverterapi.com/api/v5/convert?q=' + queryString;

  // Append the result of the currency conversion below the form.
  function showResult(targetVal){
    let parentDiv = document.querySelector('#result');
    let newDiv = document.createElement('DIV');
    newDiv.innerHTML += `${baseAmount} ${baseCurrency} is equal to ${targetVal} ${targetCurrency}`;
    parentDiv.appendChild(newDiv);
    newDiv.setAttribute('class', 'alert alert-success');
    newDiv.setAttribute('role', 'alert');
    return newDiv;
  }

  // calculates the conversion give the base currency rate and amount.
  function convert(rate){
    let targetVal = baseAmount * rate;
    return targetVal;
  }

  // Fetch exchange rate for user-given currency query.
  fetch(queryUrl).then(function(response) {
    myJson = response.json();
    return myJson;
  }).then(function(data){
    let targetRate = data.results[queryString].val;

    // Store a copy of the queried currencies rate first, to an IDB database.
    dbPromise.then(function(db){
      let tx = db.transaction('currencyRates', 'readwrite');
      let currencyRatesStore = tx.objectStore('currencyRates');

      currencyRatesStore.put({
        currencyQuery: queryString,
        rate: targetRate
      });

      return tx.complete;
    });

    showResult(convert(targetRate));

  }).catch(function(error){
    // fetch currency conversion from the currency-convertor indexedDB, if there is an error.
      dbPromise.then(function(db){
      let tx = db.transaction('currencyRates');
      let currencyRatesStore = tx.objectStore('currencyRates');
      return currencyRatesStore.get(queryString);
    }).then(function(exch){
      showResult(convert(exch.rate));
    });
  });

  // prevent browser from reloading.
  e.preventDefault();
}
