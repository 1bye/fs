// import { initializeApp } from "firebase/app";
import firebase from "firebase-admin";
import googleConfig from "@config/google.config";
// import { getAuth, setPersistence, inMemoryPersistence } from "firebase/auth";

export {  } from "firebase/auth";

const firebaseProject = firebase.initializeApp({
    projectId: googleConfig.projectId,
});


const firebaseAuth = firebaseProject.auth();


// const firebaseAuth = getAuth(firebaseProject);
//
// await setPersistence(firebaseAuth, inMemoryPersistence);

export {
    firebaseProject,
    firebaseAuth
}