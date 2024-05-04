
export class MultiLang {

  constructor() {
    console.log('multi lang')
  }
  /**
   * @description
   * Multi language system is already deep integrated like common feature
   * in developing apps proccess.
   */

  T = {};

  load = async (path) => {
    let x = null;
    if(path) {
      x = await this.loadMultilang(path);
    } else {
      x = await this.loadMultilang();
    }

    // Internal exspose to the global obj
    this.T = x;
    T = x;
    dispatchEvent(new CustomEvent('app.ready', {
      detail: {
        info: 'app.ready'
      }
    }));
  }

  translate = {
    update: function() {
      var allTranDoms = document.querySelectorAll('[data-label]');
      console.log(allTranDoms)
      allTranDoms.forEach((i) => {
        i.innerHTML = T[i.getAttribute('data-label')]
      })
    }
  };

  loadMultilang = async function(lang = 'en') {
    lang = 'res/multilang/' + lang + '.json';
    console.info("Multilang: ", lang);
    try {
      const r = await fetch(lang, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return await r.json();
    } catch(err) {
      console.warn('Not possible to access multilang json asset! Err => ', err);
      return {};
    }
  };

}