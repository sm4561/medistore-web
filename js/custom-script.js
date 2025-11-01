// Firebase project configuration. Replace with your own.
const firebaseConfig = {
    apiKey: "AIzaSyChrB0ClWB6KlZgCc4x1rEtxGoYTahLD9I",
    authDomain: "medistore-web-77ee9.firebaseapp.com",
    projectId: "medistore-web-77ee9",
    storageBucket: "medistore-web-77ee9.appspot.com",
    messagingSenderId: "921084167652",
    appId: "1:921084167652:web:87d3169100501ba812b3f1"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const getQueryParams = () => {
        const params = {};
        window.location.search.substring(1).split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
                params[key] = value;
            }
        });
        return params;
    };

    const params = getQueryParams();
    const articleId = params.id;

    const articleTitleElement = document.getElementById('article-title');
    const articleImageElement = document.getElementById('article-image');
    const articleContentElement = document.getElementById('article-content');
    const pageTitleElement = document.getElementById('page-title');

    if (articleId) {
        const articleRef = db.collection('articles').doc(articleId);

        articleRef.get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();

                pageTitleElement.innerText = data.title;
                articleTitleElement.innerText = data.title;
                articleImageElement.src = data.imageURL;
                articleContentElement.innerHTML = data.content;
            } else {
                console.log("No such document!");
                pageTitleElement.innerText = "Article Not Found";
                articleTitleElement.innerText = "Article Not Found";
                articleContentElement.innerHTML = `<p class="text-center text-red-400">The requested article could not be found.</p>`;
                articleImageElement.style.display = 'none';
            }
        }).catch((error) => {
            console.error("Error getting document:", error);
            pageTitleElement.innerText = "Error";
            articleTitleElement.innerText = "Error";
            articleContentElement.innerHTML = `<p class="text-center text-red-400">An error occurred while fetching the article. Please try again later.</p>`;
            articleImageElement.style.display = 'none';
        });
    } else {
        pageTitleElement.innerText = "Invalid Article";
        articleTitleElement.innerText = "Invalid Article";
        articleContentElement.innerHTML = `<p class="text-center text-yellow-400">Please select an article from the homepage.</p>`;
        articleImageElement.style.display = 'none';
    }
});