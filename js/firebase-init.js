const firebaseConfig = {
    apiKey: "AIzaSyAUBwx-i38T6rfr9lsNYUV6bLOpxvdPfjQ",
    authDomain: "solar-ai-advisor-6e70c.firebaseapp.com",
    projectId: "solar-ai-advisor-6e70c",
    storageBucket: "solar-ai-advisor-6e70c.firebasestorage.app",
    messagingSenderId: "414713467470",
    appId: "1:414713467470:web:437d1cf23454d472c7e91f"
  };

  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  // Auth SDK is only loaded on pages that need it (not quote-comparison)
  if (typeof firebase.auth === 'function') {
    window.auth = firebase.auth();
  }
