const path = require('path')
const express = require('express');
const fs = require('fs').promises;
const Storage = require('node-storage')
const cors = require('cors');
const bcrypt = require('bcrypt');

const crypto = require('crypto');

// Helper function to generate a unique verification token
function generateVerificationToken() {
    return crypto.randomBytes(16).toString('hex');
}

function initializeAdminUser() {
    let users = storeUsers.get('users') || [];

    if (!users.some(user => user.email === 'admin@uwo.ca')) {
        const adminPassword = 'admin';
        const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);

        users.push({
            email: 'admin@uwo.ca',
            hashedPassword: hashedAdminPassword,
            nickname: 'Admin',
            isVerified: true,
            admin: true
        });

        storeUsers.put('users', users);
    }
}




const storeLists = new Storage(path.join(__dirname,'storeLists.json'));
const storeUsers = new Storage(path.join(__dirname,'users.json'));  


const app = express();
const port = 8080;

// Routers initialization
const infoRouter = express.Router();
const powersRouter = express.Router();
const listRouter = express.Router();
const userRouter = express.Router();

// File paths
const infoFilePath = 'server\\superhero_info.json';
const powersFilePath = 'server\\superhero_powers.json';

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
app.use(cors());
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


//LAB4 


userRouter.post('/register', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        // Check if this is the admin user
        const isAdmin = email === 'admin@uwo.ca';

        // Use a default password for the admin user
        const finalPassword = isAdmin ? 'admin' : password;

        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        let users = storeUsers.get('users') || [];

        if (users.some(user => user.email === email)) {
            return res.status(400).json({message: 'User already exists'});
        }

        const verificationToken = generateVerificationToken();

        users.push({ 
            email, 
            hashedPassword, 
            nickname, 
            isVerified: false, 
            verificationToken,
            admin: isAdmin // Set admin flag
        });

        storeUsers.put('users', users);
            
        res.status(201).json({ message: 'User created successfully. Please verify your email.', verificationToken });
    } catch (error) {
        res.status(500).json('Error in user registration');
    }
});


userRouter.put('/updatePassword', async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        // Retrieve existing users
        let users = storeUsers.get('users') || [];

        // Find the user
        const user = users.find(user => user.email === email);

        if (!user) {
            return res.status(404).json({message:'User not found'});
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({message:'Email not verified'});
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({message:'Wrong old password'});
        }

        // Update user's password
        user.hashedPassword = await bcrypt.hash(newPassword, 10);

        // Store updated users array
        storeUsers.put('users', users);

        res.json({message:'Password updated successfully'});
    } catch (error) {
        console.error('Error in updating password:', error); // Log any errors
        res.status(500).json({message:'Error in updating password'});
    }

});


userRouter.get('/getUserByEmail', async (req, res) => {
    try {
        const { email } = req.query;  // Get email from query parameters

        // Retrieve existing users
        const users = storeUsers.get('users') || [];

        // Find the user by email
        const user = users.find(user => user.email === email);

        // If user is found, return user data
        if (user) {
            // Return user details except the hashed password
            const { hashedPassword, ...userDetails } = user;
            return res.status(200).send(userDetails);
        } else {
            // User not found
            return res.status(404).json({message:'User not found'});
        }
    } catch (error) {
        res.status(500).json({message:'Error during user retrieval'});
    }
});

// New endpoint for verifying email
userRouter.get('/verifyEmail', async (req, res) => {
    const { token } = req.query;

    // Retrieve existing users
    let users = storeUsers.get('users') || [];

    // Find user with the given token
    const userIndex = users.findIndex(user => user.verificationToken === token);

    if (userIndex === -1) {
        return res.status(404).json({message:'Invalid or expired verification link'});
    }

    // Set isVerified to true
    users[userIndex].isVerified = true;

    // Remove the verification token as it's no longer needed
    delete users[userIndex].verificationToken;

    // Store updated users array
    storeUsers.put('users', users);

    res.json({message:'Email verified successfully. You can now log in.'});
});

userRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve existing users
        let users = storeUsers.get('users') || [];

        // Find user by email
        const user = users.find(user => user.email === email);

        if (!user) {
            return res.status(404).json({message:'User not found'});
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({message:'Email not verified'});
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(401).json({message: 'Invalid password'});
        }
        if (isMatch) {
            res.json({ message: 'Login successful', isAdmin: user.admin });
        }
        // res.send('Login successful');}

    } catch (error) {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});


infoRouter.route('/search')
    .get((req, res) => {
        const { name, Race, Publisher } = req.query;
        let Power = req.query['Power '] || req.query['Power'];

        // Decode URI components and trim whitespace
        Power = Power ? decodeURIComponent(Power).trim().toLowerCase() : null;
        const queryName = name ? decodeURIComponent(name).trim().toLowerCase() : null;
        const queryRace = Race ? decodeURIComponent(Race).trim().toLowerCase() : null;
        const queryPublisher = Publisher ? decodeURIComponent(Publisher).trim().toLowerCase() : null;

        let results = superhero_info;

        if (queryName) {
            results = results.filter(hero => hero.name.toLowerCase().trim().startsWith(queryName));
        }

        if (queryRace) {
            results = results.filter(hero => hero.Race && hero.Race.toLowerCase().trim().startsWith(queryRace));
        }

        if (queryPublisher) {
            results = results.filter(hero => hero.Publisher && hero.Publisher.toLowerCase().trim().startsWith(queryPublisher));
        }

        if (Power) {
            results = results.filter(hero => {
                // Trim and lowercase the hero name for accurate matching
                const heroNameLower = hero.name.toLowerCase().trim();
                const heroPowers = superhero_powers.find(p => p.hero_names.toLowerCase().trim() === heroNameLower);
                // Check for the power, making the comparison case-insensitive
                return heroPowers && Object.entries(heroPowers).some(([key, value]) => 
                    key.toLowerCase().trim() === Power && String(value).toLowerCase() === "true");
            });
        }

        // Return only name and publisher of each hero
        results = results.map(hero => ({ name: hero.name.trim(), Publisher: hero.Publisher.trim() }));

        res.json(results);
    });

infoRouter.route('/details/:name')
    .get((req, res) => {
        const superheroName = req.params.name;
        const superhero = superhero_info.find(s => s.name.toLowerCase() === superheroName.toLowerCase());
        
        if (!superhero) {
            return res.status(404).json({message: 'Superhero not found'});
        }

        // Exclude name and Publisher from the superhero details
        const { name, Publisher, ...details } = superhero;

        // Find the superhero's powers marked as True
        const powers = superhero_powers.find(p => p.hero_names === superheroName);
        const truePowers = powers ? Object.fromEntries(Object.entries(powers).filter(([power, hasPower]) => hasPower === "True" && power !== "hero_names")) : {};

        res.json({ details, powers: truePowers });
    });



    
// Mount the users router
app.use('/api/superhero_info', infoRouter);
app.use('/api/superhero_powers', powersRouter);
app.use('/api/superhero_lists', listRouter);
app.use('/api/users', userRouter);

app.listen(port, () => {
    initializeAdminUser();
    console.log(`Listening on port ${port}`);
});

