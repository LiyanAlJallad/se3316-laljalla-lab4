const path = require('path')
const express = require('express');
const fs = require('fs').promises;
const Storage = require('node-storage')
const cors = require(cors)



const storeLists = new Storage(path.join(__dirname,'storeLists.json')) 

const app = express();
const port = 8080;

// Routers initialization
const infoRouter = express.Router();
const powersRouter = express.Router();
const listRouter = express.Router();

// File paths
const infoFilePath = 'superhero_info.json';
const powersFilePath = 'superhero_powers.json';

let superhero_info = [];
let superhero_powers = [];
// let superhero_lists = [];

// Load superhero information from the file
async function loadSuperheroData() {
    try {
        const data = await fs.readFile(infoFilePath, 'utf8');
        superhero_info = JSON.parse(data);
    } catch (error) {
        console.error('Error reading superhero info file:', error);
    }
}

// Load superhero powers information from the file
async function loadSuperheroPowersData() {
    try {
        const data = await fs.readFile(powersFilePath, 'utf8');
        superhero_powers = JSON.parse(data);
    } catch (error) {
        console.error('Error reading superhero powers file:', error);
    }
}

loadSuperheroData();
loadSuperheroPowersData();

// Middlewares
app.use(express.static(path.join(__dirname,'../static')));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next();
});
app.use(cors({origin: 'https://54.159.105.180/'}));
let superhero_lists = storeLists.get('superhero_lists') || [];

// Routes for superhero_info
infoRouter.route('/')
    .get((req, res) => res.send(superhero_info));

infoRouter.route('/publishers')
    .get((req, res) => {
        let publishers = [];
        superhero_info.forEach(hero => {
            if (!publishers.includes(hero.Publisher)) {
                publishers.push(hero.Publisher);
            }
        });
        res.send(publishers);
    });

infoRouter.route('/:id(\\d+)')
    .get((req, res) => {
        const superhero = superhero_info.find(s => s.id === parseInt(req.params.id));
        superhero ? res.send(superhero) : res.status(404).send(`Superhero ${req.params.id} was not found!`);
    });
infoRouter.route('/allNames')
    .get((req, res) => {
        // Assuming superhero_info is an array with superhero objects
        const names = superhero_info.map(s => s.name);
        res.send(names);
    });
infoRouter.route('/getIDs')
    .post((req, res) => {
        const { names } = req.body;
        const ids = superhero_info
            .filter(hero => names.includes(hero.name))
            .map(hero => hero.id);
        res.json(ids);
    });



// Routes for superhero_powers
powersRouter.route('/')
    .get((req, res) => res.send(superhero_powers));

powersRouter.route('/:id(\\d+)')
    .get((req, res) => {
        const superheroId = parseInt(req.params.id);
        const superhero = superhero_info.find(s => s.id === superheroId);
        if (superhero) {
            const powers = superhero_powers.find(p => p.hero_names === superhero.name);
            if (powers) {
                // Filter out only the powers that are true
                const truePowers = Object.fromEntries(Object.entries(powers).filter(([power, hasPower]) => hasPower === "True" && power !== "hero_names"));
                res.send(truePowers);
            } else {
                res.status(404).send(`Powers for Superhero ${superhero.name} not found`);
            }
        } else {
            res.status(404).send(`Superhero ${superheroId} not found`);
        }
    });

powersRouter.route('/all')
    .get((req, res) => {
        const allPowers = new Set();
        superhero_powers.forEach(heroPowers => {
            Object.keys(heroPowers).forEach(power => {
                if (power !== "hero_names") {
                    allPowers.add(power);
                }
            });
        });
        res.send(Array.from(allPowers));
    });

powersRouter.route('/byPower')
    .get((req, res) => {
        const powerToSearch = req.query.power;

        const heroesWithPower = superhero_powers
            .filter(heroPower => String(heroPower[powerToSearch]).toLowerCase() === "true")
            .map(heroPower => superhero_info.find(hero => hero.name === heroPower.hero_names))
            .filter(hero => hero !== undefined); // Filter out any undefined heroes

        if (heroesWithPower.length > 0) {
            res.send(heroesWithPower);
        } else {
            res.status(404).send(`No heroes found with power: ${powerToSearch}`);
        }
    });

infoRouter.route('/match')
    .get((req, res) => {
        const { field, pattern } = req.query;
        const n = req.query.n ? Math.min(parseInt(req.query.n, 10), 999) : superhero_info.length; // Limit the max number of results to 999

        // const n = parseInt(req.query.n, 10) || superhero_info.length;

        // Check if the required parameters are provided
        if (!field || !pattern) {
            return res.status(400).send('Missing required parameters');
        }

        // Filter superheroes based on the given field and pattern
        const matchedSuperheroes = superhero_info.filter(hero => {
            if (typeof hero[field] === 'string') {
                return hero[field].toLowerCase().startsWith(pattern.toLowerCase());
            } else if (typeof hero[field] === 'number') {
                return hero[field] === parseInt(pattern, 10);
            }
            return false;
        }).slice(0, n);
        
        res.send(matchedSuperheroes);
    });


listRouter.route('/')
    .get((req, res) => {
        res.send(superhero_lists);
    })
    .post((req, res) => {
        const newLists = req.body;
        if (!Array.isArray(newLists)) {
            return res.status(400).send('Expected an array of lists');
        }
        let errors = [];
        newLists.forEach(newList => {
            if (superhero_lists.some(list => list.name === newList.name)) {
                errors.push(`List name "${newList.name}" already exists.`);
            } else {
                superhero_lists.push({ name: newList.name, ID: newList.ID || [] });
            }
        });
        if (errors.length) {
            res.status(400).send(errors.join(' '));
        } else {
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                        
            res.status(201).send('Lists added successfully.');
        }
    });

listRouter.route('/listNames')
    .get((req, res) => {
        const listNames = superhero_lists.map(list => list.name);
        res.send(listNames);
    });

listRouter.route('/:name')
    .put((req, res) => {
        const listName = req.params.name;
        const newIDs = req.body.ID;
        const list = superhero_lists.find(list => list.name === listName);
        
        if (list) {
            const updatedIDs = new Set([...list.ID, ...newIDs]);
            list.ID = Array.from(updatedIDs);
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                       
            res.send(list);
        } else {
            res.status(400).send('List name does not exist');
        }
    })
    .get((req, res) => {
        const listName = req.params.name;
        const list = superhero_lists.find(list => list.name === listName);
        list ? res.send(list.ID) : res.status(404).send('List not found');
    })
    .delete((req, res) => {
        const listName = req.params.name;
        const listIndex = superhero_lists.findIndex(list => list.name === listName);
        if (listIndex !== -1) {
            superhero_lists.splice(listIndex, 1);
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                       
            res.send({ message: `List ${listName} deleted successfully!` });
        } else {
            res.status(404).send('List not found');
        }
    });

listRouter.route('/:name/update')
    .put((req, res) => {
        const listName = req.params.name;
        const { ID } = req.body;
        const listIndex = superhero_lists.findIndex(list => list.name === listName);
        
        if (listIndex > -1) {
            superhero_lists[listIndex].ID = ID;
            try {
                storeLists.put('superhero_lists', superhero_lists);
            } catch (error) {
                console.error('Error saving to storage:', error);
                // Handle the error appropriately
            }
                      
            res.status(200).send(superhero_lists[listIndex]);
        } else {
            res.status(404).send('List not found');
        }
    });

listRouter.route('/:name/info')
    .get((req, res) => {
        const listName = req.params.name;
        const list = superhero_lists.find(list => list.name === listName);
        if (!list) {
            return res.status(404).send('List not found');
        }
        const detailedSuperheroes = list.ID.map(heroID => {
            const superheroInfo = superhero_info.find(s => s.id === heroID);
            const superheroPowers = superhero_powers.find(p => p.hero_names === superheroInfo.name);
            return { ...superheroInfo, powers: superheroPowers };
        });
        res.send(detailedSuperheroes);
    });


// Mount the routers
app.use('/api/superhero_info', infoRouter);
app.use('/api/superhero_powers', powersRouter);
app.use('/api/superhero_lists', listRouter);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

