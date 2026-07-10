import {en} from "../../public/res/multilang/en-backup";
import {LOG_FUNNY_ARCADE} from "../engine/utils";

export class MultiLang {

  constructor() {
    addEventListener('updateLang', () => {this.update()})
  }

  update = function() {
    var allTranDoms = document.querySelectorAll('[data-label]');
    try {
      allTranDoms.forEach((i) => {i.innerHTML = this.get[i.getAttribute('data-label')]})
    } catch(e) {console.warn("MultiLang error:" + e)}
  }

  loadMultilang = async function(lang = 'en') {
    if(lang == 'rs') lang = 'sr';
    lang = 'res/multilang/' + lang + '.json';
    console.info(`%cMultilang: ${lang}`, LOG_FUNNY_ARCADE);
    try {
      const r = await fetch(lang, {headers: {'Accept': 'application/json', 'Content-Type': 'application/json'}});
      return await r.json();
    } catch(err) {
      console.warn('Not possible to access multilang json asset! Err => ', err, '. Use backup lang predefinited object. Only english avaible.');
      return en;
    }
  }
}