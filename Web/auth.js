var isLoggedin = false;
var isAllowed = 0;
var lo = document.getElementById("lo");
var lo1 = document.getElementById("lo1");
var preloadli = document.getElementById("preloadli");
var preloadsu = document.getElementById("preloadsu");
var selectform = document.getElementById("selectform");
var allocatebtn = document.getElementById("allocate");
var excelbtn = document.getElementById("excel1");
var table1 = document.getElementById("table");
var table2 = document.getElementById("Coursetable");
var resBtn = document.getElementById("resBtn");
var resCloseText = document.getElementById("resClosed");
var resultwithimg = document.getElementById("wait");
var waitimg = document.getElementById("wait");
var pubbtn = document.getElementById("publish");
var pubpara = document.getElementById("publishpara");
var useremail;
var noUser = document.getElementById("noUser");
var gprn = [];
var gname = [];
var gcgpa = [];
var gpref = [];
var gallocate = [];
noUser.style.display = "none";
pubpara.style.display = "none";
resultwithimg.style.display = "none";
resCloseText.style.display = "none";
table1.style.visibility = "collapse";
table2.style.visibility = "collapse"
allocatebtn.style.display = "none";
selectform.style.display = "none";
lo.style.display = "none";
lo1.style.display = "none";
preloadli.style.display = "none";
preloadsu.style.display = "none";
subtn.style.display = "block";
libtn.style.display = "block";
isAllowedfn();
const myModal = document.querySelectorAll('.modal')
async function signup(e) {
    e.preventDefault()
    var subtn = document.getElementById("subtn");
    subtn.style.display = "none";
    preloadsu.style.display = "block";
    const email = document.querySelector('#signUpPRN')
    const password = document.querySelector('#signUpPassword')
    try {
        if (email.value.length != 10) {
            throw {
                message: "Invalid PRN",
                error: new Error()
            };
        }
        const result = await firebase.auth().createUserWithEmailAndPassword(email.value + "@prn.com", password.value)
        /*if(email.value=="1234567890")
        {
            await result.user.updateProfile({
            displayName: "Admin"
        });
        M.toast({html: 'Admin signup', classes: 'green rounded', displayLength: 1500})
        }
        else
        {*/
        await result.user.updateProfile({
            displayName: "User"
        });
        //}
        M.toast({ html: 'Sign in successful', classes: 'green rounded', displayLength: 1500 })
        email.value = ""
        password.value = ""
        M.Modal.getInstance(myModal[0]).close()
    }
    catch (err) {
        if (err.code == "auth/email-already-in-use") {
            err.message = "PRN already exist"
        }
        window.alert(err.message);
        subtn.style.display = "block";
        preloadsu.style.display = "none";
    }

}
async function login(e) {
    e.preventDefault()
    var libtn = document.getElementById("libtn");
    libtn.style.display = "none";
    preloadli.style.display = "block";
    const email = document.querySelector('#loginPRN')
    const password = document.querySelector('#LoginPassword')
    try {
        if (email.value.length != 10) {
            throw {
                message: "Invalid PRN",
                error: new Error()
            };
        }

        const result = await firebase.auth().signInWithEmailAndPassword(email.value + "@prn.com", password.value)
        if (await result.user.displayName == "Admin") {
            M.toast({ html: 'Admin Login', classes: 'green rounded', displayLength: 1500 })
        }
        else {
            isAllowedfnforstud();
            firebase.firestore().collection("Registration State").doc("State")
                .onSnapshot((doc) => {
                    isAllowedfnforstud();
                });
        }
        M.toast({ html: 'Login successful', classes: 'green rounded', displayLength: 1500 })
        isLoggedin = true
        email.value = ""
        password.value = ""
        M.Modal.getInstance(myModal[1]).close()
        hideLI()
    }
    catch (err) {
        if (err.code == "auth/wrong-password") {
            err.message = "Incorrect Password"
        }
        if (err.code == "auth/user-not-found") {
            err.message = "PRN does not exist, Please sign-up"
        }
        window.alert(err.message)
        libtn.style.display = "block";
        preloadli.style.display = "none";
    }
}

async function getCGPA() {
    const db = firebase.firestore();

    //get all signed in users
    db.collection("user").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(doc.id);

            //get data of signed in users
            var docRef = db.collection("Student Database").doc(doc.id);
            docRef.get().then((doc) => {
                if (doc.exists) {
                    console.log("Document data:", doc.data()["CGPA"]);

                    //update CGPA signed in users
                    db.collection("user").doc(doc.id).update({
                        CGPA: doc.data()["CGPA"],
                        Name: doc.data()["Name"]
                    })
                        .then(() => {
                            console.log("Document successfully written!");
                        })
                        .catch((error) => {
                            console.error("Error writing document: ", error);
                        });

                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });
        });
    });


}

async function getSortedData() {
    const db = firebase.firestore();
    var sortedPRN = [];
    var name = [];
    var CGPA = [];
    var pref1 = [];
    var pref2 = [];
    var pref3 = [];
    var pref4 = [];
    var allocation = [];
    await db.collection("user").orderBy("CGPA", "desc")
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                sortedPRN.push(doc.id);
                pref1.push(doc.data()["pref1"])
                pref2.push(doc.data()["pref2"])
                pref3.push(doc.data()["pref3"])
                pref4.push(doc.data()["pref4"])
                CGPA.push(doc.data()["CGPA"])
                name.push(doc.data()["Name"])
                allocation.push(doc.data()["allocation"])
            });
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
    loadCapacity(sortedPRN, pref1, pref2, pref3, pref4, CGPA, name, allocation);
}

async function loadCapacity(sortedPRN, pref1, pref2, pref3, pref4, CGPA, name, allocation) {
    var totalCapDict = {};
    var filledDict = {};
    var coursename = {};
    await firebase.firestore().collection("Courses").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                totalCapDict[doc.id] = doc.data()["totalCap"]
                filledDict[doc.id] = doc.data()["filled"]
                coursename[doc.id] = doc.data()["Course Name"]
            });
        })
    allocate(sortedPRN, pref1, pref2, pref3, pref4, totalCapDict, filledDict, CGPA, name, coursename, allocation)
}
function addresponse(prn, p1, p2, p3, p4) {
    firebase.firestore().collection('user').doc(prn)
        .set({
            pref1: p1,
            pref2: p2,
            pref3: p3,
            pref4: p4,
            allocation: 0
        })
}
async function allocate(sortedPRN, pref1, pref2, pref3, pref4, totalCapDict, filledDict, CGPA, name, coursename, allocation) {
    if (isAllowed == 2) {
        M.toast({ html: 'Unpublish the result to allocate', classes: 'red rounded', displayLength: 1500 })
        return;
    }

    var x
    var allocate = allocation;
    deletestudRows();
    var j = 0
    for (x in sortedPRN) {
        j = j + 1
        var milgaya = 0;
        for (i = 1; i < 5; i++) {
            if (allocation[x] != 0) {
                break;
            }
            else if (totalCapDict[pref1[x]] > filledDict[pref1[x]] && i == 1 && milgaya == 0) {
                milgaya = 1;
                filledDict[pref1[x]] = filledDict[pref1[x]] + 1;
                allocate[x] = pref1[x]
                firebase.firestore().collection("user").doc(sortedPRN[x]).update({
                    allocation: pref1[x]
                })
                    .then(() => {
                        console.log("Document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing document: ", error);
                    });
                break;
            }
            else if (totalCapDict[pref2[x]] > filledDict[pref2[x]] && i == 1 && milgaya == 0) {
                milgaya = 1;
                filledDict[pref2[x]] = filledDict[pref2[x]] + 1;
                allocate[x] = pref2[x]
                firebase.firestore().collection("user").doc(sortedPRN[x]).update({
                    allocation: pref2[x]
                })
                    .then(() => {
                        console.log("Document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing document: ", error);
                    });
                break;
            }
            else if (totalCapDict[pref3[x]] > filledDict[pref3[x]] && i == 1 && milgaya == 0) {
                milgaya = 1;
                filledDict[pref3[x]] = filledDict[pref3[x]] + 1;
                allocate[x] = pref3[x]
                firebase.firestore().collection("user").doc(sortedPRN[x]).update({
                    allocation: pref3[x]
                })
                    .then(() => {
                        console.log("Document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing document: ", error);
                    });
                break;
            }
            else if (totalCapDict[pref4[x]] > filledDict[pref4[x]] && i == 1 && milgaya == 0) {
                milgaya = 1;
                filledDict[pref4[x]] = filledDict[pref4[x]] + 1;
                allocate[x] = pref4[x]
                firebase.firestore().collection("user").doc(sortedPRN[x]).update({
                    allocation: pref4[x]
                })
                    .then(() => {
                        console.log("Document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing document: ", error);
                    });
                break;
            }
            else {
                allocate[x] = 0;
                firebase.firestore().collection("user").doc(sortedPRN[x]).update({
                    allocation: 0
                })
                    .then(() => {
                        console.log("Document successfully written!");
                    })
                    .catch((error) => {
                        console.error("Error writing document: ", error);
                    });
                break;
            }

        }

        fillstudtable(j, sortedPRN[x], name[x], CGPA[x], pref1[x] + "," + pref2[x] + "," + pref3[x] + "," + pref4[x], allocate[x])

    }
    for (i = 1; i < 5; i++) {
        fillcoursetable(i, i, coursename[i], filledDict[i], totalCapDict[i])
        firebase.firestore().collection("Courses").doc(i.toString()).update({
            filled: filledDict[i]
        })
            .then(() => {
                console.log("Document successfully written!");
            })
            .catch((error) => {
                console.error("Error writing document: ", error);
            });
    }
}
function deletestudRows() {
    var rows = document.getElementById("table").rows.length;
    for (i = 2; i < rows; i++)
        document.getElementById("table").deleteRow(1);
    deletecourseRows()
}
function deletecourseRows() {
    var rows = document.getElementById("Coursetable").rows.length;
    for (i = 2; i < rows; i++)
        document.getElementById("Coursetable").deleteRow(1);
}
async function getTable() {
    if (document.getElementById("Coursetable").rows.length > 2)
        return;
    i = 0;
    const db = firebase.firestore()
    await db.collection("user").orderBy("CGPA", "desc").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            i = i + 1;
            fillstudtable(i, doc.id, doc.data()["Name"], doc.data()["CGPA"], doc.data()["pref1"] + "," + doc.data()["pref2"] + "," + doc.data()["pref3"] + "," + doc.data()["pref4"], doc.data()["allocation"])
        });
    });
    j = 0
    await db.collection("Courses").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            j = j + 1;
            document.getElementsByName('c' + j)[0].placeholder = doc.data()["Course Name"] + " Capacity";
            fillcoursetable(j, doc.id, doc.data()["Course Name"], doc.data()["filled"], doc.data()["totalCap"])
        });
    });
}
async function reset(e) {
    if (e != null) {
        e.preventDefault()
        M.Modal.getInstance(myModal[3]).close()
    }
    if (isAllowed == 2) {
        M.toast({ html: 'Unpublish the result to reset', classes: 'red rounded', displayLength: 1500 })
        return;
    }
    M.toast({ html: 'Reset Successfully', classes: 'green rounded', displayLength: 1500 })
    deletestudRows();
    const db = firebase.firestore()
    await db.collection("user").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(doc.id);
            db.collection("user").doc(doc.id).update({
                allocation: 0
            })
                .then(() => {
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
        });
    });
    await db.collection("Courses").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(doc.id);
            db.collection("Courses").doc(doc.id).update({
                filled: 0
            })
                .then(() => {
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
        });
    });
    getTable();
}


function logout() {
    firebase.auth().signOut().then(() => {
        M.toast({ html: 'Log out successful', classes: 'green rounded', displayLength: 1500 })
    }).catch((error) => {
        window.alert(error.message)
    });
}
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        noUser.style.display = "none";
        useremail = user.email;
        useremail = useremail.slice(0, 10);
        if (user.displayName == "Admin") {
            M.toast({ html: 'Admin Login', classes: 'green rounded', displayLength: 1500 })
            showbtntoadmin();
            getTable()
        }
        else {
            isAllowedfnforstud();
            firebase.firestore().collection("Registration State").doc("State")
                .onSnapshot((doc) => {
                    isAllowedfnforstud();
                });
        }
        isLoggedin = true
        hideLI()
        var test = document.getElementById("test");
        document.getElementById("lo").innerHTML = user.email.slice(0, 10);
        document.getElementById("lo1").innerHTML = user.email.slice(0, 10);
        console.log(user)
    } else {
        noUser.style.display = "block";
        selectform.style.display = "none";
        resultwithimg.style.display = "none";
        resCloseText.style.display = "none";
        pubpara.style.display = "none";

        isLoggedin = false
        hideLO()
        hidebtnforstud();
    }
});
function hideLI() {
    var x = document.getElementById("li");
    var y = document.getElementById("lo");
    var z = document.getElementById("su");
    var x1 = document.getElementById("li1");
    var y1 = document.getElementById("lo1");
    var z1 = document.getElementById("su1");
    if (isLoggedin) {
        x.style.display = "none";
        y.style.display = "block";
        z.style.display = "none";
        x1.style.display = "none";
        y1.style.display = "block";
        z1.style.display = "none";
    }
}
async function editCap(e) {
    e.preventDefault()
    var cc = [];
    cc.push(document.querySelector('#cc1'))
    cc.push(document.querySelector('#cc2'))
    cc.push(document.querySelector('#cc3'))
    cc.push(document.querySelector('#cc4'))
    //const password = document.querySelector('#signUpPassword')
    if (isAllowed != 2) {
        for (i = 1; i < 5; i++) {
            try {
                if (!cc[i - 1].value > 0) {
                    throw {
                        message: "Invalid Data",
                        error: new Error()
                    };
                }
                else {
                    firebase.firestore().collection("Courses").doc(i.toString()).update({
                        totalCap: cc[i - 1].value
                    })
                        .then(() => {
                            console.log("Document successfully written!");
                        })
                        .catch((error) => {
                            console.error("Error writing document: ", error);
                        });
                }
            }
            catch (err) {
                console.log(err.message)
            }
        }
    }
    M.Modal.getInstance(myModal[2]).close()
    reset(null);
}
function resetfnclose(e) {
    e.preventDefault()
    M.Modal.getInstance(myModal[3]).close()
}
async function fillform(e) {
    e.preventDefault()
    var p1 = document.getElementById("p1").selectedIndex;
    var p2 = document.getElementById("p2").selectedIndex;
    var p3 = document.getElementById("p3").selectedIndex;
    var p4 = document.getElementById("p4").selectedIndex;
    var wannabelate = false;
    var preallocation;
    var filledcheck = 0;
    try {
        if (p1 == p2 || p1 == p3 || p1 == p4 || p2 == p3 || p2 == p4 || p3 == p4 || !p1 || !p2 || !p3 || !p4) {
            window.alert("Invalid choices")
        }
        else {
            await firebase.firestore().collection("user").doc(firebase.auth().currentUser.email.slice(0, 10)).get().then((doc) => {
                if (doc.exists) {
                    if (doc.data()["allocation"] != 0) {
                        wannabelate = true;
                        preallocation = doc.data()["allocation"];
                    }
                }
                else {

                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });

            await firebase.firestore().collection("Student Database").doc(firebase.auth().currentUser.email.slice(0, 10)).get().then((doc) => {
                if (doc.exists) {
                    addresponse(firebase.auth().currentUser.email.slice(0, 10), p1, p2, p3, p4);
                    M.toast({ html: 'Response Added', classes: 'green rounded', displayLength: 1500 })
                    getCGPA();
                }
                else {
                    window.alert("You are not in our database, please contact developer for further info");
                    M.toast({ html: 'Invalid user', classes: 'red rounded', displayLength: 1500 })
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });
            if (wannabelate) {

                await firebase.firestore().collection("Courses").doc(preallocation.toString()).get().then((doc) => {
                    if (doc.exists) {
                        filledcheck = doc.data()["filled"] - 1;
                        if (filledcheck < 0) {
                            filledcheck = 0;
                        }
                    } else {

                    }
                }).catch((error) => {
                    console.log("Error getting document:", error);
                });
                console.log("check this " + 3)
                await firebase.firestore().collection('Courses').doc(preallocation.toString())
                    .update({
                        filled: filledcheck
                    })
            }
        }
    }
    catch (err) {
        window.alert(err)
    }

}
function hideLO() {
    var x = document.getElementById("li");
    var y = document.getElementById("lo");
    var z = document.getElementById("su");
    var x1 = document.getElementById("li1");
    var y1 = document.getElementById("lo1");
    var z1 = document.getElementById("su1");
    if (!isLoggedin) {
        lo.style.display = "none";
        lo1.style.display = "none";
        preloadli.style.display = "none";
        preloadsu.style.display = "none";
        x.style.display = "block";
        y.style.display = "none";
        z.style.display = "block";
        x1.style.display = "block";
        y1.style.display = "none";
        z1.style.display = "block";
        subtn.style.display = "block";
        libtn.style.display = "block";
    }
}
function showbtntoadmin() {
    allocatebtn.style.display = "block";
    table1.style.visibility = "visible";
    table2.style.visibility = "visible";
    pubpara.style.display = "block";

}
function hidebtnforstud() {
    allocatebtn.style.display = "none";
    table1.style.visibility = "collapse";
    table2.style.visibility = "collapse";
    pubpara.style.display = "none";
}


function fillstudtable(i, prn, name, cgpa, pref, allocation) {
    gprn[i - 1] = prn;
    gcgpa[i - 1] = cgpa;
    gname[i - 1] = name;
    gpref[i - 1] = pref;
    gallocate[i - 1] = allocation;
    var table = document.getElementById("table");
    var row = table.insertRow(i);
    var prnfield = row.insertCell(0);
    var namefield = row.insertCell(1);
    var cgpafield = row.insertCell(2);
    var preffield = row.insertCell(3);
    var allocationfield = row.insertCell(4);
    prnfield.innerHTML = prn;
    namefield.innerHTML = name;
    cgpafield.innerHTML = cgpa;
    preffield.innerHTML = pref;
    allocationfield.innerHTML = allocation;
}
function fillcoursetable(i, id, name, filled, totalCap) {
    var table = document.getElementById("Coursetable");
    var row = table.insertRow(i);
    var idfield = row.insertCell(0);
    var namefield = row.insertCell(1);
    var filledfield = row.insertCell(2);
    var totalCapfield = row.insertCell(3);
    idfield.innerHTML = id;
    namefield.innerHTML = name;
    filledfield.innerHTML = filled;
    totalCapfield.innerHTML = totalCap;
}

async function registration() {
    await firebase.firestore().collection("Registration State").doc("State").get().then((doc) => {
        if (doc.data()["Allow"] == 0) {
            firebase.firestore().collection("Registration State").doc("State").update({
                Allow: 1
            })
                .then(() => {
                    isAllowedfn();
                    M.toast({ html: 'Registrations opened', classes: 'green rounded', displayLength: 1500 })
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
        }
        else if (doc.data()["Allow"] == 1) {
            firebase.firestore().collection("Registration State").doc("State").update({
                Allow: 0
            })
                .then(() => {
                    isAllowedfn();
                    M.toast({ html: 'Registrations closed', classes: 'red rounded', displayLength: 1500 })
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
        }

    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}
async function isAllowedfn() {
    await firebase.firestore().collection("Registration State").doc("State").get().then((doc) => {
        if (doc.data()["Allow"] == 0) {
            isAllowed = 0;
            resBtn.innerHTML = "Open Registration"
            M.Tooltip.init(resBtn, { html: 'Currently Closed' });
            pubbtn.innerHTML = "Publish";
            M.Tooltip.init(pubbtn, { html: 'Currently unpublished' });
        }
        else if (doc.data()["Allow"] == 1) {
            isAllowed = 1;
            resBtn.innerHTML = "Close Registration"
            M.Tooltip.init(resBtn, { html: 'Currently Opened' });
            pubbtn.innerHTML = "Publish";
            M.Tooltip.init(pubbtn, { html: 'Currently unpublished' });
        }
        else if (doc.data()["Allow"] == 2) {
            isAllowed = 2;
            resBtn.style.visibility = "hidden";
            pubbtn.innerHTML = "Unpublish";
            M.Tooltip.init(pubbtn, { html: 'Currently published' });
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}
async function isAllowedfnforstud() {
    firebase.firestore().collection("Registration State").doc("State").get().then((doc) => {
        if (doc.data()["Allow"] == 0) {
            isAllowed = 0;
            selectform.style.display = "none";
            resultwithimg.style.display = "block";
            resCloseText.style.display = "block";
            resCloseText.innerHTML = "Registration is closed, the result will be published soon";
            waitimg.src = "./assets/wait.png"
        }
        else if (doc.data()["Allow"] == 1) {
            isAllowed = 1;
            resultwithimg.style.display = "none";
            resCloseText.style.display = "none";
            selectform.style.display = "block";
        }
        else if (doc.data()["Allow"] == 2) {
            firebase.firestore().collection("user").doc(useremail)
                .get()
                .then((doc) => {
                    isAllowed = 2;
                    selectform.style.display = "none";
                    resultwithimg.style.display = "block";
                    resCloseText.style.display = "block";
                    firebase.firestore().collection("Courses").doc(doc.data()["allocation"].toString()).get().then((doc) => {
                        if (doc.exists) {
                            resCloseText.innerHTML = "Congrats! Your allocated subject is " + doc.data()["Course Name"];
                            waitimg.src = "./assets/congo.png"
                        }
                        else {
                            resCloseText.innerHTML = "Sorry! No subject Allocated";
                            waitimg.src = "./assets/sorry.png"
                        }
                    }).catch((error) => {
                        console.log("Error getting document:", error);
                    });

                })
                .catch((error) => {
                    console.log("Error getting documents: ", error);
                });
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}
async function publish() {
    await firebase.firestore().collection("Registration State").doc("State").get().then((doc) => {
        if (doc.data()["Allow"] == 0) {
            firebase.firestore().collection("Registration State").doc("State").update({
                Allow: 2
            })
                .then(() => {
                    isAllowedfn();
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
            M.toast({ html: 'Result published', classes: 'green rounded', displayLength: 1500 })
            resBtn.style.visibility = "hidden";
            pubbtn.innerHTML = "Unpublish";
        }
        else if (doc.data()["Allow"] == 1) {
            M.toast({ html: 'Close the Registration to publish', classes: 'red rounded', displayLength: 1500 })
        }
        else if (doc.data()["Allow"] == 2) {
            firebase.firestore().collection("Registration State").doc("State").update({
                Allow: 0
            })
                .then(() => {
                    resBtn.style.visibility = "visible";
                    isAllowedfn();
                    console.log("Document successfully written!");
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
            M.toast({ html: 'Result unpublished', classes: 'green rounded', displayLength: 1500 })

        }

    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}

function htmltoexcel() {
    var table2excel = new Table2Excel();
    table2excel.export(document.querySelectorAll("#table"));
}
function sortTable(op) {
    revivetable();
    if (op == 1) {
        var table, rows, switching, i, x, y, shouldSwitch;
        table = document.getElementById("table");
        switching = true;
        while (switching) {
            switching = false;
            rows = table.rows;
            for (i = 1; i < (rows.length - 1); i++) {
                shouldSwitch = false;
                x = rows[i].getElementsByTagName("TD")[2];
                y = rows[i + 1].getElementsByTagName("TD")[2];
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }
    }
    else if (op == 2) {
        var table, rows, i, x, y;
        table = document.getElementById("table");
        rows = table.rows;
        y = 0;
        for (i = 1; i < (rows.length); i++) {
            x = rows[i].getElementsByTagName("TD")[4];
            if (x.innerHTML.toLowerCase() != 1) {
                document.getElementById("table").deleteRow(i);
                i--;
                console.log(x.innerHTML.toLowerCase());
            }
        }
    }
    else if (op == 3) {
        var table, rows, i, x, y;
        table = document.getElementById("table");
        rows = table.rows;
        y = 0;
        for (i = 1; i < (rows.length); i++) {
            x = rows[i].getElementsByTagName("TD")[4];
            if (x.innerHTML.toLowerCase() != 2) {
                document.getElementById("table").deleteRow(i);
                i--;
                console.log(x.innerHTML.toLowerCase());
            }
        }
    }
    else if (op == 4) {
        var table, rows, i, x, y;
        table = document.getElementById("table");
        rows = table.rows;
        y = 0;
        for (i = 1; i < (rows.length); i++) {
            x = rows[i].getElementsByTagName("TD")[4];
            if (x.innerHTML.toLowerCase() != 3) {
                document.getElementById("table").deleteRow(i);
                i--;
                console.log(x.innerHTML.toLowerCase());
            }
        }
    }
    else if (op == 5) {
        var table, rows, i, x, y;
        table = document.getElementById("table");
        rows = table.rows;
        y = 0;
        for (i = 1; i < (rows.length); i++) {
            x = rows[i].getElementsByTagName("TD")[4];
            if (x.innerHTML.toLowerCase() != 4) {
                document.getElementById("table").deleteRow(i);
                i--;
                console.log(x.innerHTML.toLowerCase());
            }
        }
    }
    else if (op == 6) {
        var table, rows, i, x, y;
        table = document.getElementById("table");
        rows = table.rows;
        y = 0;
        for (i = 1; i < (rows.length); i++) {
            x = rows[i].getElementsByTagName("TD")[4];
            if (x.innerHTML.toLowerCase() != 0) {
                document.getElementById("table").deleteRow(i);
                i--;
                console.log(x.innerHTML.toLowerCase());
            }
        }
    }
    else {
        var table, rows, switching, i, x, y, shouldSwitch;
        table = document.getElementById("table");
        switching = true;
        while (switching) {
            switching = false;
            rows = table.rows;
            for (i = 1; i < (rows.length - 1); i++) {
                shouldSwitch = false;
                x = rows[i].getElementsByTagName("TD")[4];
                y = rows[i + 1].getElementsByTagName("TD")[4];
                if (x.innerHTML.toLowerCase() == 0)
                    x.innerHTML.toLowerCase() = 5;
                if (y.innerHTML.toLowerCase() == 0)
                    y.innerHTML.toLowerCase() = 5;
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }
    }
}
function revivetable() {
    var i, j;
    var rows = document.getElementById("table").rows.length;
    for (i = 2; i < rows; i++)
        document.getElementById("table").deleteRow(1);
    console.log(gprn);
    console.log(gname);
    console.log(gcgpa);
    console.log(gpref);
    console.log(gallocate);
    for (j = 1; j <= gprn.length; j++) {
        var table = document.getElementById("table");
        var row = table.insertRow(j);
        var prnfield = row.insertCell(0);
        var namefield = row.insertCell(1);
        var cgpafield = row.insertCell(2);
        var preffield = row.insertCell(3);
        var allocationfield = row.insertCell(4);
        prnfield.innerHTML = gprn[j - 1];
        namefield.innerHTML = gname[j - 1];
        cgpafield.innerHTML = gcgpa[j - 1];
        preffield.innerHTML = gpref[j - 1];
        allocationfield.innerHTML = gallocate[j - 1];
    }
}