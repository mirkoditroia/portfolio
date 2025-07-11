/* Firebase simple initializer */
(function(){
  if(window.APP_ENV !== 'prod') {
    console.log('🔥 Firebase skipped - not in production environment');
    return; // Non-production env: skip
  }

  console.log('🔥 Firebase initialization starting...');

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAZyywhWm0Ju-N_YhIgUhWaqENfXrgZ8fY",
    authDomain: "portfolio-eb526.firebaseapp.com",
    projectId: "portfolio-eb526",
    storageBucket: "portfolio-eb526.firebasestorage.app",
    messagingSenderId: "92912043022",
    appId: "1:92912043022:web:c49dc167d9c84ead46a85f",
    measurementId: "G-TRZ856L9ZZ"
  };
  
  async function init(){
    try{
      console.log('🔥 Loading Firebase modules...');
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const { getFirestore, getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      
      console.log('🔥 Initializing Firebase app...');
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      console.log('🔥 Firebase initialized successfully');
      
      // Simple function to get site data
      window.getSiteData = async function() {
        try {
          console.log('🔥 Loading site data from Firestore...');
          const docRef = doc(db, 'config', 'site');
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('🔥 Site data loaded from Firestore:', data);
            return data;
          } else {
            console.log('🔥 No site document found in Firestore');
            return {};
          }
        } catch (error) {
          console.error('🔥 Error loading site data from Firestore:', error);
          throw error;
        }
      };
      
      // Simple function to save site data
      window.saveSiteData = async function(data) {
        try {
          console.log('🔥 Saving site data to Firestore...', data);
          const { setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
          const docRef = doc(db, 'config', 'site');
          await setDoc(docRef, data, { merge: true });
          console.log('🔥 Site data saved successfully to Firestore');
        } catch (error) {
          console.error('🔥 Error saving site data to Firestore:', error);
          throw error;
        }
      };
      
      console.log('🔥 Firebase functions registered successfully');
      
    } catch(err) {
      console.error('🔥 Firebase initialization error:', err);
    }
  }
  
  init();
})(); 