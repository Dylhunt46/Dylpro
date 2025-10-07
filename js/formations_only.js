document.addEventListener('DOMContentLoaded', () => {
    const detailsContainer = document.getElementById('details-container');

    async function loadData() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des données.');
            }
            const data = await response.json();
            
            const formations = data.formations; 

            formations.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));

            displayItems(formations);

        } catch (error) {
            console.error(error);
            detailsContainer.innerHTML = '<p>Désolé, impossible de charger les détails des formations.</p>';
        }
    }

    function displayItems(items) {
        items.forEach(item => {
            const isExperience = item.type === 'experience';
            const className = isExperience ? 'experience-detail' : 'formation-detail';
            
            const startDate = new Date(item.start_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
            const endDate = item.end_date ? new Date(item.end_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : 'Présent';
            const period = `${startDate} - ${endDate}`;

            let specificContent = '';
            if (isExperience) {
                specificContent = `<p class="contract">Type de Contrat : <strong>${item.contract_type || 'Non Spécifié'}</strong></p>`;
                specificContent += `<p class="location">${item.location}</p>`;
            } else {
                specificContent = `<p class="school">${item.school}</p>`;
                specificContent += `<p class="location">${item.location}</p>`;
            }
            
            const cardHtml = `
                <article class="detail-card ${className}">
                    <h2>${item.title}</h2>
                    <p class="company">${isExperience ? item.company : item.school}</p>
                    <p class="period">${period}</p>
                    ${specificContent}
                    <p class="description">${item.description}</p>
                    <div class="skills">
                        <strong>Compétences :</strong> ${item.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </article>
            `;

            detailsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    loadData();
});