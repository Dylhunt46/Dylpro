document.addEventListener('DOMContentLoaded', () => {
    // Ciblage des conteneurs
    const expContainer = document.getElementById('latest-experience-card');
    const formContainer = document.getElementById('latest-training-card');

    async function loadData() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données.');
            }
            const data = await response.json();

            // 1. Gérer la dernière Expérience
            const latestExp = findLatestItem(data.experiences);
            if (latestExp) {
                displayItem(latestExp, expContainer);
            } else {
                expContainer.innerHTML = '<p>Aucune expérience disponible pour le moment.</p>';
            }

            // 2. Gérer la dernière Formation
            const latestForm = findLatestItem(data.formations);
            if (latestForm) {
                displayItem(latestForm, formContainer);
            } else {
                formContainer.innerHTML = '<p>Aucune formation disponible pour le moment.</p>';
            }

        } catch (error) {
            console.error('Erreur de chargement des données pour l\'accueil:', error);
            expContainer.innerHTML = '<p>Impossible de charger les données.</p>';
            formContainer.innerHTML = '<p>Impossible de charger les données.</p>';
        }
    }

    // Fonction utilitaire pour trouver l'élément le plus récent (basé sur la date de fin)
    function findLatestItem(items) {
        if (!items || items.length === 0) return null;
        
        // Copie et tri par date de fin (du plus récent au plus ancien).
        // Si end_date est 'Présent' ou null, on le met en premier.
        return [...items].sort((a, b) => {
            const dateA = a.end_date === 'Présent' || !a.end_date ? new Date() : new Date(a.end_date);
            const dateB = b.end_date === 'Présent' || !b.end_date ? new Date() : new Date(b.end_date);
            return dateB - dateA;
        })[0]; // Le premier élément trié est le plus récent
    }

    // Fonction pour générer le HTML de la carte
    function displayItem(item, container) {
        const isExperience = item.type === 'experience';
        
        const startDate = new Date(item.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        const endDate = item.end_date ? new Date(item.end_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : 'Présent';
        const period = `${startDate} - ${endDate}`;

        const locationText = item.location ? `<p class="location">${item.location}</p>` : '';
        const contractText = isExperience ? `<p class="contract_type">Contrat : ${item.contract_type || 'Non spécifié'}</p>` : '';
        const entityName = isExperience ? item.company : item.school;
        const entityClass = isExperience ? 'company' : 'school';

        const skillsTags = item.skills ? item.skills.map(skill => `<span class="tag">${skill}</span>`).join('') : '';

        container.innerHTML = `
            <div class="card-header">
                <h3>${item.title}</h3>
                <span class="date">${period}</span>
            </div>
            <p class="${entityClass}">${entityName}</p>
            ${contractText}
            ${locationText}
            <div class="card-body">
                <p class="description">${item.description}</p>
                <div class="tags">${skillsTags}</div>
            </div>
        `;
    }

    loadData();
});