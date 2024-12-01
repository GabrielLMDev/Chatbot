const sessions = {};

const getSession = (id) => sessions[id];
const updateSession = (id, context) => {
  sessions[id] = { context };
};

module.exports = { getSession, updateSession };
