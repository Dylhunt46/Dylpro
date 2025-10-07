document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour récupérer je JSON
    const fetchTimelineData = async () => {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) {
                throw new Error('Erreur de chargement du fichier de données.');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    // Fonction pour créer un élément de la timeline
    const createTimelineItem = (item) => {
        const link = document.createElement('a');
        link.href = item.type === 'experience' ? 'experiences.html' : 'formations.html';

        // console.log(`Création du lien pour : ${item.title}, avec l'attribut href : ${link.href} `);

        link.classList.add('timeline-link');
        // Création du conteneur principal de l'élément de la timeline
        const timelineItem = document.createElement('div');
        timelineItem.classList.add('timeline-item');
        timelineItem.classList.add(item.type) // Expérience ou formation

        // Création de la date
        const dateContainer = document.createElement('div');
        dateContainer.classList.add('timeline-date');
        
        const startDate = new Date(item.start_date);
        const endDate = item.end_date ? new Date(item.end_date) : null;
        const dateOptions = { year: 'numeric', month: 'long' };
        
        // Formatage des dates
        if (endDate) {
            dateContainer.textContent = `${startDate.toLocaleDateString('fr-FR', dateOptions)} - ${endDate.toLocaleDateString('fr-FR', dateOptions)}`;
        } else {
            dateContainer.textContent = startDate.toLocaleDateString('fr-FR', dateOptions)
        }
        // Création du titre de la carte
        const title = document.createElement('h3');
        title.textContent = item.title;

        // Ajout des éléments
        timelineItem.appendChild(title);
        link.appendChild(timelineItem);

        // Ajout de l'élément de date en dehors du lien
        const wrapper = document.createElement('div');
        wrapper.classList.add('timeline-wrapper');
        wrapper.classList.add(item.type);
        wrapper.appendChild(dateContainer);
        wrapper.appendChild(link);
        

        // const description = document.createElement('p');
        // description.textContent = item.description;

        // timelineItem.appendChild(title);
        // timelineItem.appendChild(description);

        // // Ajout des tags de compétences
        // const tagsContainer = document.createElement('div');
        // tagsContainer.classList.add('tags');
        // if (item.skills && Array.isArray(item.skills)) {
        //     item.skills.forEach(skill => {
        //         const tag = document.createElement('span');
        //         tag.classList.add('tag');
        //         tag.textContent = skill;
        //         tagsContainer.appendChild(tag);
        //     });
        // }
        // timelineItem.appendChild(tagsContainer);

        return wrapper;
    };

    // Fonction principale pour afficher la timeline
    const renderTimeline = async () => {
        const data = await fetchTimelineData();
        if (!data) return;

        const allItems = [...data.experiences, ...data.formations];

        // Tri des éléments par date de début, du plus récent au plus ancien
        allItems.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

        const timelineContainer = document.querySelector('.timeline-container');
        if (timelineContainer) {
            timelineContainer.innerHTML = ''; // Nettoyer le conteneur avant d'ajouter les éléments
            allItems.forEach(item => {
                const timelineElement = createTimelineItem(item);
                timelineContainer.appendChild(timelineElement);
            });
        }
    };
    
    // Appeler la fonction de rendu lorsque la page est chargée
    if (document.querySelector('.timeline-container')) {
        renderTimeline();
    }
    
    
})