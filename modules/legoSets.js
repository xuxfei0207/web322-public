const setData = require("../data/setData");
const themeData = require("../data/themeData");

let sets = [];

function initialize() {
    return new Promise((resolve, reject) => {
        setData.forEach(data => {
            const theme = themeData.find(theme => theme['id'] === data['theme_id']);
            if (theme) {
                const setDataWithTheme = {
                    ...data,
                    theme: theme.name
                };
                sets.push(setDataWithTheme);
            }
        }) 
        resolve();   
    });
    
}


// const sample1 = {
//     'a' : 1,
//     'b' : 2
// }

// const sample2 = {
//     ...sample1,
//     'c' : 3
// }

// //
// sample2 = {
//     'a' : 1,
//     'b' : 2,
//     'c' : 3
// }

// const nums = [1, 2, 3];
// nums.forEach(num => {
//     console.log("num: ", num);
// })

// for (const num of nums) {
//     console.log("num: ", num);
// }

// nums.find(num => num === 2);

// const a  =  3;
// arr = [1, 2];

// arr.push(a) // arr = [1, 2, 3]


function getAllSets() {
    return new Promise((resolve, reject) => {
        if (sets.length === 0) {
            reject("sets array is empty. Call initialize() first.");
        } else {
            resolve([...sets]);
        }
    });
}

function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
        const foundSet = sets.find(data => data.set_num === setNum);
        if (foundSet) {
            resolve(foundSet);
        } else {
            reject(`Can't find set with set_num: ${setNum}`);
        }
    });
}

function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
        if (sets.length === 0) {
            reject("Sets array is empty. Call initialize() first.");
        } else {
            // const lowercaseTheme = theme.toLowerCase();
            const matchingSets = sets.filter(set => set.theme.toLowerCase().includes(theme.toLowerCase()));

            if (matchingSets.length > 0) {
                resolve([...matchingSets]);
            } else {
                reject(`Can't find sets with theme: ${theme}`);
            }
        }
    });   
}

// Test if initialize() works - it works!
// initialize()
//   .then(() => {
//     // Do something after initialization is complete, e.g., log the populated `sets` array.
//     console.log(sets);
//   })
//   .catch((error) => {
//     // Handle any errors that may occur during initialization.
//     console.error('Initialization failed:', error);
//   });

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme };
// set.theme.lowercaseTheme().include(lowercaseTheme)
// 'service packs'.include('service')
// [1, 2, 3].include(2)

