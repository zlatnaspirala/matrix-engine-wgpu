import {byId, isMobile, jsonHeaders, mb} from "../../../src/engine/utils.js";

/**
 * @description This is clone from hang3d.
 * @author Nikola Lukic 
 * @email zlatnaspirala@gmail.com
 * @website https://maximumroulette.com
 */

export class RCSAccount {

  email = null;
  token = null;

  constructor(apiDomain) {

    this.apiDomain = apiDomain;

    this.visitor()

    addEventListener('F12', (e) => {
      console.log(`%c[Debbuger] ${e.detail}`, REDLOG)
      localStorage.removeItem("visitor");
      this.visitor(e.detail)
    })

    this.leaderboardBtn = document.createElement('div')
    this.leaderboardBtn.id = 'Leaderboard';
    this.leaderboardBtn.innerHTML = `
		  <button id="leaderboardBtn" class="btn">Leaderboard</button>
		`;
    document.body.appendChild(this.leaderboardBtn);

    this.leaderboardBtn = document.getElementById('leaderboardBtn');
    this.leaderboardBtn.addEventListener("click", this.getLeaderboard)
  }

  createDOM = () => {
    var parent = document.createElement('div');
    this.parent = parent;
    //parent.classList.add('')
    parent.id = 'myAccountLoginForm';

    var logo = document.createElement('img');
    logo.id = 'logologin';
    logo.setAttribute('alt', 'Login');
    logo.style = 'width: 100px;border-radius: 10px;padding: 6px;'
    logo.src = './res/icons/512.webp';

    var title = document.createElement('div');
    title.style.display = 'flex';
    title.innerHTML = `
		
		<div style='width:100%; margin: 5px 5px;'> <h2 style='margin: 5px 5px;'>Rocket GamePlay Login Form</h2>
		 Maximumroulette.com</div>
		`;
    title.appendChild(logo)

    var content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.background = 'transparent';

    var emailLabel = document.createElement('label');
    emailLabel.id = 'emailLabel';
    emailLabel.innerHTML = `Email:`;
    emailLabel.setAttribute('for', 'arg-email');
    var email = document.createElement('input');
    // email.classList.add('myInput')
    email.id = 'arg-email';
    var passLabel = document.createElement('label');
    passLabel.id = 'passLabel';
    passLabel.innerHTML = `Passw:`;
    passLabel.setAttribute('for', 'arg-pass');
    var pass = document.createElement('input');
    pass.id = 'arg-pass';
    // pass.classList.add('myInput')
    var loginBtn = document.createElement('button');
    loginBtn.id = 'loginRCSBtn'
    loginBtn.innerHTML = `LOGIN`;
    loginBtn.classList.add('btn')
    loginBtn.classList.add('btnMargin')
    loginBtn.addEventListener('click', this.login)

    var gotoRegisterMyAccount = document.createElement('button');
    gotoRegisterMyAccount.id = 'registerBtn';
    gotoRegisterMyAccount.classList.add(`btn`);
    gotoRegisterMyAccount.classList.add(`btnMargin`);
    gotoRegisterMyAccount.innerHTML = `REGISTER`;
    gotoRegisterMyAccount.addEventListener('click', this.register)

    var hideLoginMyAccount = document.createElement('button');
    hideLoginMyAccount.classList.add(`btn`);
    hideLoginMyAccount.classList.add(`btnMargin`);
    hideLoginMyAccount.innerHTML = `NO LOGIN -> INSTANT PLAY`;
    hideLoginMyAccount.addEventListener('click', () => {
      byId('myAccountLoginForm').remove();
    })

    if(isMobile() == false) {
      var descText = document.createElement('div');
      descText.id = 'descText';
      descText.style = 'font-size:smaller;'
      descText.innerHTML = `<span style="width:45%" >Welcome to rocketCraftingServer platform, enjoy in 'Forest Of Hollow Blood' lets magic begin.</span>`;
      // <span style="width:45%;" >Add Url params '?video=false&audio=false' to disable streaming</span>
    }

    parent.appendChild(title)
    parent.appendChild(content)
    content.appendChild(emailLabel)
    content.appendChild(email)
    content.appendChild(passLabel)
    content.appendChild(pass)
    content.appendChild(loginBtn)
    content.appendChild(gotoRegisterMyAccount)
    content.appendChild(hideLoginMyAccount)
    // content.appendChild(logo)
    if(isMobile() == false) content.appendChild(descText);
    document.body.appendChild(parent)
  }

  createLeaderboardDOM = (data) => {
    if(byId('leaderboard') != null) {
      byId('leaderboard').style.display = 'block';
      return;
    }
    // console.log('TEST MOBILE +++')
    var parent = document.createElement('div');
    parent.style = ``;
    parent.classList.add('leaderboard')
    // if(isMobile() == true) {
    // 	parent.style = `
    // 	position: absolute;
    // 	border-radius: 4px;
    // 	top: 10%;
    // 	left: 0%;
    // 	width: 95%;
    // 	padding: 10px;`;
    // }
    parent.id = 'leaderboard';

    var title = document.createElement('div');
    title.innerHTML = `<h3>Top 10 leaderboard [RocketCraftingServer]</h3>`;
    parent.appendChild(title)

    var tableLabel = document.createElement('div');
    tableLabel.style.display = 'flex';
    tableLabel.style.flexDirection = 'row';
    var nicklabel = document.createElement('div');
    nicklabel.innerText = 'Nickname';
    nicklabel.style.width = '100%';
    var pointslabel = document.createElement('div');
    pointslabel.innerText = 'Points';
    pointslabel.style.width = '100%';
    tableLabel.appendChild(nicklabel)
    tableLabel.appendChild(pointslabel)

    parent.appendChild(tableLabel)

    var parentForTable = document.createElement('div');
    parentForTable.style.height = '70vh';
    parentForTable.style.overflow = 'scroll';
    parentForTable.style.overflowX = 'hidden';
    data.forEach((element, index) => {
      var table = document.createElement('div');
      table.style.display = 'flex';
      table.style.flexDirection = 'row';
      table.style.justifyContent = 'center';
      table.style.alignItems = 'center';
      table.style.boxShadow = 'none';

      var nick = document.createElement('div');
      nick.innerText = element.nickname;
      nick.style.width = '100%';
      if(index == 0) {
        nick.style.boxShadow = '0px 7px 2px -1px #ffe100';
      } else if(index == 1) {
        nick.style.boxShadow = '0px 7px 2px -1px white';
      } else if(index == 2) {
        nick.style.boxShadow = '0px 7px 2px -1px #a01010';
      } else {
        nick.style.boxShadow = '0px 7px 2px -1px #757471';
      }
      var points = document.createElement('div');
      points.innerText = element.points;
      points.style.width = '100%';
      if(index == 0) {
        points.style.boxShadow = '0px 7px 2px -1px #ffe100';
      } else if(index == 1) {
        points.style.boxShadow = '0px 7px 2px -1px white';
      } else if(index == 2) {
        points.style.boxShadow = '0px 7px 2px -1px #a01010';
      } else {
        points.style.boxShadow = '0px 7px 2px -1px #757471';
      }
      // var medal = document.createElement('img');
      // medal.id = 'medal';
      // logo.src = './assets/icons/icon96.png';
      table.appendChild(nick)
      table.appendChild(points)
      table.innerHTML += (ROCK_RANK.getRankMedalImg(ROCK_RANK.getRank(element.points)))
      parentForTable.appendChild(table)
    });

    parent.appendChild(parentForTable)

    var hideBtn = document.createElement('button');
    hideBtn.classList = 'btn';
    hideBtn.style.marginTop = '7px';
    hideBtn.innerText = 'HIDE';
    hideBtn.addEventListener('click', () => {
      parent.style.display = 'none';
    })
    parent.appendChild(hideBtn)

    document.body.appendChild(parent)
  }

  register = () => {
    this.register_procedure(this)
  }

  async register_procedure() {
    let route = this.apiDomain || location.origin;
    byId('loginRCSBtn').disabled = true;
    byId('registerBtn').disabled = true;
    let args = {
      emailField: (byId('arg-email') != null ? byId('arg-email').value : null),
      passwordField: (byId('arg-pass') != null ? byId('arg-pass').value : null)
    }
    if(args.emailField == null || args.passwordField == null) {
      mb.show('Please fill up email and passw for login or register.')
    }
    fetch(route + '/rocket/register', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(args)
    }).then((d) => {
      return d.json();
    }).then((r) => {
      mb.error(`${r.message}`)
      if(r.message == "Check email for conmfirmation key.") {
        this.email = byId('arg-email').value;
        sessionStorage.setItem('email', byId('arg-email').value)
        byId('emailLabel').remove();
        byId('loginRCSBtn').remove();
        byId('arg-email').remove();
        byId("passLabel").innerHTML = 'ENTER CONFIRMATION CODE';
        byId('arg-pass').value = "";
        byId('registerBtn').removeEventListener('click', this.register)
        byId('registerBtn').disabled = false;
        byId('registerBtn').innerHTML = 'CONFIRM CODE FROM EMAIL';
        byId('registerBtn').id = 'CC';
        byId('CC').addEventListener('click', () => {
          this.confirmation()
        })
        sessionStorage.setItem('RocketAcountRegister', 'Check email for conmfirmation key.')
      } else {
        setTimeout(() => {
          mb.show("Next Register/Login call try in 5 secounds...")
          this.preventDBLOG = false;
          this.preventDBREG = false;
          byId('loginRCSBtn').disabled = false;
          byId('registerBtn').disabled = false;
        }, 5000)
      }
    }).catch((err) => {
      console.log('[My Account Error]', err)
      mb.show("Next Register call try in 5 secounds...")
      setTimeout(() => {
        this.preventDBLOG = false;
        this.preventDBREG = false;
        byId('loginRCSBtn').disabled = false;
        byId('registerBtn').disabled = false;
      }, 5000)
      return;
    })
  }

  confirmation = async () => {
    let route = this.apiDomain;
    const args = {
      emailField: this.email,
      tokenField: byId('arg-pass').value,
    }
    fetch(route + '/rocket/confirmation', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(args)
    }).then((d) => {
      return d.json();
    }).then((r) => {
      if(r.message == "Wrong confirmation code.") {
      } else if(r.message == "Confirmation done.") {
        alert(r.message)
        this.parent.innerHTML = '';
        // ----
        this.createDOM();
      }
      mb.error(`${r.message}`)
    })

  }

  login = async () => {
    let route = this.apiDomain || location.origin;
    byId('loginRCSBtn').disabled = true;
    byId('registerBtn').disabled = true;
    let args = {
      emailField: (byId('arg-email') != null ? byId('arg-email').value : null),
      passwordField: (byId('arg-pass') != null ? byId('arg-pass').value : null)
    }
    fetch(route + '/rocket/login', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(args)
    }).then((d) => {
      return d.json();
    }).then((r) => {
      console.log(r.message);
      mb.show(`${r.message}`)
      if(r.message == "User logged") {
        this.email = byId('arg-email').value;
        byId('myAccountLoginForm').style.display = 'none';
        sessionStorage.setItem('RocketAcount', JSON.stringify(r.flag))
      }
    }).catch((err) => {
      console.log('[My Account Error]', err)
      mb.show("Next Login call try in 5 secounds...")
      setTimeout(() => {
        this.preventDBLOG = false;
        this.preventDBREG = false;
        byId('registerBtn').disabled = false;
        byId('loginRCSBtn').disabled = false;
      }, 5000)
      return;
    })
  }

  async visitor(isRegular) {
    if(typeof isRegular === 'undefined') isRegular = 'Yes';
    if(localStorage.getItem("visitor") == 'welcome') return;
    let route = this.apiDomain;
    let args = {
      email: (byId('arg-email') != null ? byId('arg-email').value : 'no-email'),
      userAgent: navigator.userAgent.toString(),
      fromUrl: location.href.toString(),
      isRegular: isRegular
    }
    fetch(route + '/rocket/visitors', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(args)
    }).then((d) => {
      return d.json();
    }).then(() => {
      localStorage.setItem("visitor", "welcome")
    }).catch((err) => {console.log('ERR', err)})
  }

  getLeaderboard = async (e) => {
    e.preventDefault();
    byId('netHeaderTitle').click();
    this.leaderboardBtn.disabled = true;
    fetch(this.apiDomain + '/rocket/public-leaderboard', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({})
    }).then((d) => {
      return d.json();
    }).then((r) => {
      mb.error(`${r.message}`)
      if(r.message == "You got leaderboard data.") {
        this.leaderboardData = r.leaderboard;
        this.createLeaderboardDOM(r.leaderboard);
      }
      setTimeout(() => {this.leaderboardBtn.disabled = false}, 5000)
    }).catch((err) => {
      console.log('[Leaderboard Error]', err)
      mb.show("Next call try in 5 secounds...")
      setTimeout(() => {this.leaderboardBtn.disabled = false}, 5000)
      return;
    })
  }

  getLeaderboardFor3dContext = async (e) => {
    // e.preventDefault();
    fetch(this.apiDomain + '/rocket/public-leaderboard', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({})
    }).then((d) => {
      return d.json();
    }).then((r) => {
      mb.error(`${r.message}`)
      if(r.message == "You got leaderboard data.") {
        this.leaderboardData = r.leaderboard;
        console.log('PREPARE FOR 3d context', this.leaderboardData)
      }
      setTimeout(() => {this.leaderboardBtn.disabled = false}, 5000)
    }).catch((err) => {
      console.log('[Leaderboard Error]', err)
      mb.show("Next call try in 5 secounds...")
      setTimeout(() => {this.leaderboardBtn.disabled = false}, 5000)
      return;
    })
  }

  async points10() {
    let route = this.apiDomain;
    if(sessionStorage.getItem('RocketAcount') != null && JSON.parse(sessionStorage.getItem('RocketAcount')).token) {
      console.log("NO ACCOUNT USER", sessionStorage.getItem('RocketAcount'))
      return;
    }
    let args = {
      email: (byId('arg-email') != null ? byId('arg-email').value : 'no-email'),
      userAgent: navigator.userAgent.toString(),
      fromUrl: location.href.toString(),
      token: JSON.parse(sessionStorage.getItem('RocketAcount')).token,
      mapName: 'FOHB',
    }
    fetch(route + '/rocket/point-plus10', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(args)
    }).then((d) => {
      return d.json();
    }).then(() => {
      localStorage.setItem("visitor", "welcome")
    }).catch((err) => {console.log('ERR', err)})
  }

  async dead() {
    let route = this.apiDomain;
    if(sessionStorage.getItem('RocketAcount') != null && JSON.parse(sessionStorage.getItem('RocketAcount')).token) {
      console.log("NO ACCOUNT USER", sessionStorage.getItem('RocketAcount'))
      return;
    }

    let args = {
      email: (byId('arg-email') != null ? byId('arg-email').value : 'no-email'),
      userAgent: navigator.userAgent.toString(),
      fromUrl: location.href.toString(),
      token: JSON.parse(sessionStorage.getItem('RocketAcount')).token,
      mapName: 'FOHB',
    }
    fetch(route + '/rocket/point-plus10', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(args)
    }).then((d) => {
      return d.json();
    }).then(() => {
      localStorage.setItem("visitor", "welcome")
    }).catch((err) => {console.log('ERR', err)})
  }
}

export var ROCK_RANK = {
  getRank: (points) => {
    points = parseInt(points);
    if(points < 1001) {
      return "junior";
    } else if(points < 2000) {
      return "senior";
    } else if(points < 3000) {
      return "captain";
    } else if(points < 5000) {
      return "general";
    } else {
      return "ultimate-killer";
    }
  },
  getRankMedalImg: (rank) => {
    if(rank == 'junior') {
      return `<img style="height: 60px" src="./res/icons/medals/1.png" />`;
    } else if(points == 'senior') {
      return `<img style="height: 60px" src="./res/icons/medals/2.png" />`;
    } else if(points == 'captain') {
      return `<img style="height: 60px" src="./res/icons/medals/3.png" />`;
    } else if(points == 'general') {
      return `<img style="height: 60px" src="./res/icons/medals/4.png" />`;
    } else {
      return `<img style="height: 60px" src="./res/icons/medals/5.png" />`;
    }
  }
};
