auth.onAuthStateChanged(async (user) => {

  if (!user) {

    window.location.href = "/login.html";

    return;
  }

  console.log(
    "Authenticated admin:",
    user.email
  );

  await validateAdminAccess(user.uid);

  await loadLeads();

});

async function validateAdminAccess(uid) {

  try {

    const adminDoc =
      await db
        .collection("admins")
        .doc(uid)
        .get();

    if (!adminDoc.exists) {

      alert(
        "Unauthorized admin access"
      );

      await auth.signOut();

      window.location.href =
        "/login.html";

      return;
    }

  }
  catch (error) {

    console.error(error);

    alert(
      "Admin validation failed"
    );

    window.location.href =
      "/login.html";
  }
}