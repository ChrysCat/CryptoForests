class Singleton {
    async showToast(msg) {
      window.alert(msg);
    }
  
    async delay(ms) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, ms);
      })
    }
  
    async getLogger() {
      return console;
    }
  
    async getStorageValue(key) {
      const val = window.localStorage.getItem(key);
      return val;
    }
  
    async setStorageValue(key, val) {
      window.localStorage.setItem(key, val);
    }
  
    async clearStorageValue() {
      window.localStorage.clear();
    }

    openUrl(url) {
      const win = window.open(url, '_blank');
      win.focus();
    }
  }
  
  export default new Singleton();
  
  