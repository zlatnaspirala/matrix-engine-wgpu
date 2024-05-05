export class MultiLang {

  constructor() {
    addEventListener('updateLang', () => {
      console.log('Multilang updated.')
      this.update();
    })
  }

  update = function() {
    var allTranDoms = document.querySelectorAll('[data-label]');
    allTranDoms.forEach((i) => {
      i.innerHTML = this.get[i.getAttribute('data-label')]
    })
  }

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
      return await r.json()
    } catch(err) {
      console.warn('Not possible to access multilang json asset! Err => ', err);
      return {}
    }
  }
}