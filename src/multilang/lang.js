import {en} from "../../public/res/multilang/en-backup";
import {LOG_FUNNY_ARCADE, LOG_MATRIX} from "../engine/utils";

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
    if (lang == 'rs') lang = 'sr'; // exc
    lang = 'res/multilang/' + lang + '.json';
    console.info(`%cMultilang: ${lang}` , LOG_FUNNY_ARCADE);
    try {
      const r = await fetch(lang, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return await r.json();
    } catch(err) {
      console.warn('Not possible to access multilang json asset! Err => ', err, '. Use backup lang predefinited object. Only english avaible.');
      return en;
    }
  }
}