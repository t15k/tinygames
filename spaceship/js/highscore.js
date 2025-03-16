class HighscoreManager {
    constructor() {
        this.MAX_ENTRIES = 10;
        this.CURRENT_VERSION = 1;
        this.STORAGE_KEY = 'spaceship_highscores';
        this.VERSION_KEY = 'spaceship_version';
        this.scores = [];
        this.loadScores();
    }

    loadScores() {
        // Check if there's a version update
        const savedVersion = parseInt(localStorage.getItem(this.VERSION_KEY) || '0');
        if (savedVersion < this.CURRENT_VERSION) {
            // Reset scores on version update
            this.scores = [];
            localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
        } else {
            // Load scores from localStorage
            try {
                const savedScores = localStorage.getItem(this.STORAGE_KEY);
                this.scores = savedScores ? JSON.parse(savedScores) : [];
            } catch (e) {
                console.error("Error loading highscores", e);
                this.scores = [];
            }
        }
    }

    saveScores() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.scores));
        localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    }

    addScore(initials, score) {
        // Make sure initials are uppercase and max 3 characters
        const entry = {
            initials: initials.toUpperCase().substring(0, 3),
            score: score
        };
        
        this.scores.push(entry);
        // Sort scores in descending order
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only the top MAX_ENTRIES
        if (this.scores.length > this.MAX_ENTRIES) {
            this.scores = this.scores.slice(0, this.MAX_ENTRIES);
        }
        
        this.saveScores();
        return this.getPosition(score);
    }

    getScores() {
        return [...this.scores];
    }

    qualifiesForHighscore(score) {
        if (this.scores.length < this.MAX_ENTRIES) {
            return true;
        }
        return score > this.getLowestScore();
    }

    getLowestScore() {
        if (this.scores.length === 0) return 0;
        return this.scores[this.scores.length - 1].score;
    }

    getPosition(score) {
        for (let i = 0; i < this.scores.length; i++) {
            if (this.scores[i].score === score) {
                return i + 1;
            }
        }
        return -1;
    }
}
