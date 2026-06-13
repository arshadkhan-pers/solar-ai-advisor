// Global variable to keep track of the listener stream
window.leadUpdatesUnsubscribe = null;

function setupRealTimeTimeline(explicitLeadId = null) {
    // 🛠️ Fallback to localStorage if no ID is passed explicitly (Universal compatibility)
    const leadId = explicitLeadId || localStorage.getItem("leadId");
    
    if (!leadId) {
        console.warn("Cannot establish real-time timeline: Lead ID missing.");
        return;
    }

    // Clean up any existing listener to prevent memory leaks/duplicate streams
    if (window.leadUpdatesUnsubscribe) {
        window.leadUpdatesUnsubscribe();
    }

    console.log("⚡ Establishing real-time listener for Lead ID:", leadId);

    // Attach the live snapshot listener
    window.leadUpdatesUnsubscribe = db.collection("leads").doc(leadId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (
    typeof window !== "undefined" &&
    data.assignedInstallerId
) {

    window.selectedInstallerId =
        data.assignedInstallerId;

    if (
        typeof renderInstallerCards === "function" &&
        window.installerCache?.length
    ) {
console.log(
    "REALTIME RE-RENDER",
    window.selectedInstallerId,
    window.installerCache
);
        renderInstallerCards(
            window.installerCache
        );

    }
}
                const latestStage = data.stage || "INITIAL";

                console.log("🔄 Real-time stage update detected:", latestStage);

                // 1. Keep localStorage updated for legacy functions on user side
                localStorage.setItem("leadStage", latestStage);

                // 2. Reactively push the updated stage directly into the UI roadmap
                if (typeof updateRoadmap === "function") {
                    updateRoadmap(latestStage, data);
                }

                // 3. Fire custom page-specific render logs if they exist
                if (typeof renderDetailedTimelineLogs === "function") {
                    renderDetailedTimelineLogs(data);
                }
                
                // 4. Admin-specific optional interface hook (if the admin view needs custom bindings)
                if (typeof onAdminLeadUpdate === "function") {
                    onAdminLeadUpdate(data);
                }
            } else {
                console.error("Lead document does not exist.");
            }
        }, (error) => {
            console.error("Real-time timeline subscription failed:", error);
        });
}
