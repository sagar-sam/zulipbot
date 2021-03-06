const recentlyClosed = new Map();

exports.close = function(issue, repository) {
  recentlyClosed.set(issue.id, issue);

  setTimeout(() => {
    clearClosed.apply(this, [issue, repository]);
  }, this.cfg.eventsDelay * 60 * 1000);
};

exports.reopen = function(issue) {
  if (recentlyClosed.has(issue.id)) recentlyClosed.delete(issue.id);
};

async function clearClosed(issue, repository) {
  const repoOwner = repository.owner.login;
  const repoName = repository.name;

  if (!recentlyClosed.has(issue.id) || !issue.assignees.length) {
    return;
  }

  const assignees = JSON.stringify({
    assignees: issue.assignees.map(a => a.login)
  });

  await this.issues.removeAssigneesFromIssue({
    owner: repoOwner, repo: repoName, number: issue.number, body: assignees
  });

  recentlyClosed.delete(issue.id);
}

exports.progress = function(payload) {
  const action = payload.action;
  const number = payload.issue.number;
  const repoOwner = payload.repository.owner.login;
  const repoName = payload.repository.name;
  const label = this.cfg.activity.issues.inProgress;
  const assignees = payload.issue.assignees.length;
  const labeled = payload.issue.labels.find(l => {
    return l.name === label;
  });

  if (action === "assigned" && !labeled) {
    this.issues.addLabels({
      owner: repoOwner, repo: repoName, number: number, labels: [label]
    });
  } else if (action === "unassigned" && !assignees && labeled) {
    this.issues.removeLabel({
      owner: repoOwner, repo: repoName, number: number, name: label
    });
  }
};
