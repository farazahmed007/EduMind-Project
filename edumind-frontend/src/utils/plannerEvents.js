const PLANNER_UPDATED_EVENT =
  "edumind-planner-updated";

export const notifyPlannerUpdated = () => {
  window.dispatchEvent(
    new CustomEvent(
      PLANNER_UPDATED_EVENT
    )
  );
};

export const subscribeToPlannerUpdates = (
  callback
) => {
  window.addEventListener(
    PLANNER_UPDATED_EVENT,
    callback
  );

  return () => {
    window.removeEventListener(
      PLANNER_UPDATED_EVENT,
      callback
    );
  };
};