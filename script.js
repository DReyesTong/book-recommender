let preferences = [];
let recommendedBooks = [];
let booksDisplayed = 0;

document.getElementById('book').addEventListener('input', function() {
    let input = this.value;
    if (input.length > 2) {
        fetch('https://www.googleapis.com/books/v1/volumes?q=' + input)
            .then(response => response.json())
            .then(data => {
                let dataList = document.getElementById('book-list');
                dataList.innerHTML = '';
                for (let item of data.items) {
                    let option = document.createElement('option');
                    option.value = item.volumeInfo.title;
                    dataList.appendChild(option);
                }
            });
    }
});

document.getElementById('book').addEventListener('change', function() {
    document.getElementById('like-about').style.display = 'block';
    document.getElementById('reset').style.display = 'block';
});

let preferenceButtons = document.getElementsByClassName('preference');
for (let button of preferenceButtons) {
    button.addEventListener('click', function() {
        preferences.push(this.dataset.preference);
        this.disabled = true;
        document.getElementById('submit').style.display = 'block';
    });
}

document.getElementById('submit').addEventListener('click', function() {
    let bookName = document.getElementById('book').value;
    if (bookName && preferences.length) {
        document.getElementById('book-form').style.display = 'none';
        getRecommendations(bookName, preferences);
    } else {
        alert('Please enter a book name and select at least one preference.');
    }
});

document.getElementById('more').addEventListener('click', function() {
    displayRecommendations(recommendedBooks);
});

document.getElementById('reset').addEventListener('click', function() {
    location.reload();
});

function getRecommendations(book, preferences) {
    //insert API key into fetch
    fetch('YOUR_API_KEY')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            let bookData = data.items[0].volumeInfo;

            let queries = preferences.map(preference => {
                if (preference === 'author' && bookData.authors) {
                    return 'inauthor:' + bookData.authors[0];
                } else if (preference === 'genre' && bookData.categories) {
                    return 'subject:' + bookData.categories[0];
                } else if (preference === 'subject' && bookData.subjects) {
                    return 'subject:' + bookData.subjects[0];
                }
                return '';
            }).filter(query => query !== '');

            let requests = queries.map(query => fetch('https://www.googleapis.com/books/v1/volumes?q=' + query));

            Promise.all(requests)
                .then(responses => Promise.all(responses.map(response => response.json())))
                .then(datas => {
                    let books = [].concat.apply([], datas.map(data => data.items));

                    let uniqueBooks = [];
                    let ids = new Set();
                    for (let book of books) {
                        if (!ids.has(book.id)) {
                            uniqueBooks.push(book);
                            ids.add(book.id);
                        }
                    }

                    // Shuffle the array of books
                    recommendedBooks = uniqueBooks.sort(() => Math.random() - 0.5);

                    if (recommendedBooks.length > 0) {
                        displayRecommendations(recommendedBooks);
                    } else {
                        document.getElementById('results').innerText = 'No results found.';
                    }
                });
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function displayRecommendations(books) {
    if (booksDisplayed < books.length) {
        for (let i = booksDisplayed; i < booksDisplayed + 3 && i < books.length; i++) {
            let book = books[i].volumeInfo;

            let bookDiv = document.createElement('div');
            bookDiv.className = 'book';

            let img = document.createElement('img');
            img.src = book.imageLinks ? book.imageLinks.thumbnail : '';
            bookDiv.appendChild(img);

            let title = document.createElement('h2');
            title.textContent = book.title;
            bookDiv.appendChild(title);

            let description = document.createElement('p');
            description.textContent = book.description ? book.description : 'No description available';
            bookDiv.appendChild(description);

            let link = document.createElement('a');
            link.href = book.infoLink;
            link.textContent = 'View on Google Books';
            bookDiv.appendChild(link);

            document.getElementById('results').appendChild(bookDiv);

            // Add a delay before each book appears
            setTimeout(() => bookDiv.style.display = 'block', (i - booksDisplayed) * 500);
        }

        booksDisplayed += 3;

        if (booksDisplayed < books.length) {
            document.getElementById('more').style.display = 'block';
        } else {
            document.getElementById('more').style.display = 'none';
        }
    }
}  