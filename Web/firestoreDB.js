function addresponse(prn,p1,p2,p3,p4)
{
    firebase.firestore().collection('user').doc(prn)
            .set({
                pref1: p1,
                pref2: p2,
                pref3: p3,
                pref4: p4,
                allocation: 0
            })
}