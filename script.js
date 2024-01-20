let currentPage = 1;
let pageSize = 10;
let repositoriesData = [];
let totalRepositories = 0;

function getRepositories() {
  const username = document.getElementById('usernameInput').value;
  pageSize = parseInt(document.getElementById('pageSize').value) || 10;

  const repositoriesList = document.getElementById('repositoriesList');
  repositoriesList.innerHTML = '<div class="loader"></div>'; 

  // Fetch user details to get the total repository count
  fetch(`https://api.github.com/users/${username}`)
      .then(response => response.json())
      .then(userData => {
          totalRepositories = userData.public_repos;
          const avatarUrl = userData.avatar_url; // Avatar URL

            const userInfo = document.getElementById('userInfo');
            userInfo.innerHTML = `
                <img src="${avatarUrl}" alt="User Avatar" style="width: 100px; height: 100px;">
                <p>Total repositories for ${username}: ${totalRepositories}</p>
            `;

          console.log(`Total repositories for ${username}: ${totalRepositories}`);

          let apiUrl = `https://api.github.com/users/${username}/repos?page=${currentPage}&per_page=${pageSize}`;

          return fetch(apiUrl);
      })
      .then(response => response.json())
      .then(repositories => {
          // Fetch topics for each repository 
          const repositoriesWithTopicsPromises = repositories.map(repo =>
              fetch(`https://api.github.com/repos/${username}/${repo.name}/topics`, {
                  headers: {
                      Accept: "application/vnd.github.mercy-preview+json" // Required for fetching topics
                  }
              })
              .then(response => response.json())
              .then(topics => ({ ...repo, topics: topics.names }))
          );

          return Promise.all(repositoriesWithTopicsPromises);
      })
      .then(repositoriesWithTopics => {
          repositoriesData = repositoriesWithTopics;
          displayRepositories(repositoriesWithTopics);
      })
      .catch(error => {
          console.error('Error fetching repositories:', error);
          repositoriesList.innerHTML = 'Error fetching repositories.';
      });
}


function displayRepositories(repositories) {
    const repositoriesList = document.getElementById('repositoriesList');
    repositoriesList.innerHTML = ''; 
    

    repositories.forEach(repo => {
        const repoElement = document.createElement('div');
        repoElement.classList.add('repo');

        const titleElement = document.createElement('h2');
        titleElement.textContent = repo.name;

        const descriptionElement = document.createElement('p');
        descriptionElement.textContent =repo.description || 'No description available.';

        const languageElement = document.createElement('p');
        languageElement.textContent = `Language: ${repo.language || 'Not specified'}`;

        const topicsElement = document.createElement('p');

        repo.topics.forEach(topic => {
            const topicButton = document.createElement('span');
            topicButton.classList.add('topic-button');
            topicButton.textContent = topic;
            topicsElement.appendChild(topicButton);
        });

        const linkElement = document.createElement('a');
        linkElement.href = repo.html_url;
        linkElement.textContent = 'Go to repository';

        repoElement.appendChild(titleElement);
        repoElement.appendChild(descriptionElement);
        repoElement.appendChild(languageElement);
        repoElement.appendChild(topicsElement);
        repoElement.appendChild(linkElement);

        repositoriesList.appendChild(repoElement);
    });

    //  pagination 
    const paginationContainer = document.createElement('div');
    paginationContainer.classList.add('pagination');

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Older';
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            getRepositories();
        }
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Newer';
    nextButton.addEventListener('click', () => {
        currentPage++;
        getRepositories();
    });

    const totalPages = Math.ceil(totalRepositories / pageSize);

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(document.createTextNode(`  ${currentPage} of ${totalPages} `));
    paginationContainer.appendChild(nextButton);

    repositoriesList.appendChild(paginationContainer);
}

function filterRepositories() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filteredRepositories = repositoriesData.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm) ||
        (repo.language && repo.language.toLowerCase().includes(searchTerm)) ||
        (repo.topics && repo.topics.some(topic => topic.toLowerCase().includes(searchTerm)))
    );

    displayRepositories(filteredRepositories);
}
