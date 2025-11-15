document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('login-form')) {
        initLoginPage();
    }

    if (document.getElementById('recherche-input')) {
        initPageRecherche();
    }
});

const ACCESS_CODE = "CODE/5959";

function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const errorCode = document.getElementById('login-error');

    if (sessionStorage.getItem('fpr_access') === 'granted') {
        window.location.href = 'recherche.html';
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const codeInput = document.getElementById('access-code').value;

        if (codeInput === ACCESS_CODE) {

            sessionStorage.setItem('fpr_access', 'granted');
            window.location.href = 'recherche.html';
        } else {

            errorCode.textContent = "Code d'accès incorrect.";
            document.getElementById('access-code').value = "";
        }
    });
}


let toutesLesFiches = [];

async function initPageRecherche() {

    if (sessionStorage.getItem('fpr_access') !== 'granted') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('fpr_access');
        window.location.href = 'index.html';
    });

    try {
        const reponse = await fetch('fpr.json');
        if (!reponse.ok) throw new Error(`HTTP error! status: ${reponse.status}`);
        
        toutesLesFiches = await reponse.json();
        
        const inputRecherche = document.getElementById('recherche-input');
        inputRecherche.addEventListener('input', (e) => {
            effectuerRecherche(e.target.value);
        });

        document.getElementById('resultats-container').innerHTML = 
            `<p class="message-initial">Base de données chargée (${toutesLesFiches.length} fiches). Effectuez une recherche.</p>`;

    } catch (error) {
        console.error("Erreur chargement fpr.json:", error);
        document.getElementById('resultats-container').innerHTML = 
            `<p class="message-erreur">Erreur critique: Impossible de charger la base de données (fpr.json).</p>`;
    }
}

function effectuerRecherche(terme) {
    const conteneur = document.getElementById('resultats-container');
    const compteur = document.getElementById('compteur-resultats');
    const termeRecherche = terme.toLowerCase().trim();

    if (termeRecherche.length < 2) {
        conteneur.innerHTML = '<p class="message-initial">Veuillez saisir au moins 2 caractères.</p>';
        compteur.textContent = '';
        return;
    }

    const resultats = toutesLesFiches.filter(fiche => {
        return (
            fiche.nom?.toLowerCase().includes(termeRecherche) ||
            fiche.prenom?.toLowerCase().includes(termeRecherche) ||
            fiche.pseudoRoblox?.toLowerCase().includes(termeRecherche) ||
            fiche.pseudoDiscord?.toLowerCase().includes(termeRecherche)
        );
    });

    conteneur.innerHTML = '';

    if (resultats.length === 0) {
        conteneur.innerHTML = '<p class="message-initial">Aucune fiche trouvée.</p>';
        compteur.textContent = '0 résultat';
    } else {
        compteur.textContent = `${resultats.length} résultat(s) trouvé(s)`;
        resultats.forEach(fiche => {
            const ficheElement = creerElementFiche(fiche);
            conteneur.appendChild(ficheElement);
        });
    }
}

function creerElementFiche(fiche) {
    const divFiche = document.createElement('div');
    divFiche.className = `fiche-resultat ${fiche.danger}`;
    divFiche.classList.add('collapsed');

    const mapTypes = {
        'J': 'Judiciaire', 'V': 'Évadé', 'S': 'Sûreté de l\'Etat',
        'X': 'Personne disparue', 'R': 'Opposition à la résidence'
    };
    const mapDanger = {
        'rouge': 'ÉLEVÉ', 'jaune': 'MOYEN', 'bleu': 'FAIBLE'
    };

    divFiche.innerHTML = `
        <div class="fiche-header-reduit">
            <span class="fiche-nom">${fiche.nom.toUpperCase()}, ${fiche.prenom}</span>
            <span class="fiche-type-reduit">Type: ${fiche.typeFiche}</span>
            <span class="fiche-danger-reduit">Niveau: ${mapDanger[fiche.danger]}</span>
            <span class="fiche-toggle-icon">▼</span>
        </div>

        <div class="fiche-details-complet">
            <div class="fiche-officielle-header">
                <img src="assets/logo_fpr.png" alt="Logo" class="fiche-logo">
                <div>
                    <h2>GALAX RP - FPR</h2>
                    <h3>FICHE DE RECHERCHE</h3>
                </div>
            </div>

            <div class="fiche-section-identite">
                <h4>1. IDENTITÉ DE LA PERSONNE</h4>
                <div class="fiche-grid">
                    <p><strong>Nom :</strong> ${fiche.prenom} ${fiche.nom.toUpperCase()}</p>
                    <p><strong>Date de Naissance :</strong> ${fiche.ddn || 'Non renseignée'}</p>
                    <p><strong>Nationalité :</strong> ${fiche.nationalite || 'Non renseignée'}</p>
                    <p><strong>Pseudo Roblox :</strong> ${fiche.pseudoRoblox || 'N/A'}</p>
                    <p><strong>Pseudo Discord :</strong> ${fiche.pseudoDiscord || 'N/A'}</p>
                </div>
            </div>

            <div class="fiche-section-signalement">
                <h4>2. SIGNALEMENT</h4>
                <div class="fiche-grid">
                    <p><strong>Type de fiche :</strong> ${mapTypes[fiche.typeFiche] || 'Inconnu'} (${fiche.typeFiche})</p>
                    <p><strong>Niveau de dangerosité :</strong> ${mapDanger[fiche.danger]}</p>
                </div>
                <p><strong>Motif de recherche :</strong> ${fiche.motif || 'Non renseigné'}</p>
                <p><strong>Conduite à tenir :</strong> ${fiche.conduite || 'Non renseignée'}</p>
            </div>
            
            ${fiche.annexe ? `<a href="${fiche.annexe}" target="_blank" class="bouton-annexe">Consulter l'annexe (décision)</a>` : ''}
        </div>
    `;

    const headerReduit = divFiche.querySelector('.fiche-header-reduit');
    headerReduit.addEventListener('click', () => {
        divFiche.classList.toggle('collapsed');
        divFiche.classList.toggle('expanded');
        const icone = divFiche.querySelector('.fiche-toggle-icon');
        icone.textContent = divFiche.classList.contains('expanded') ? '▲' : '▼';
    });

    return divFiche;
}