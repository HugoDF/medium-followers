-- Up
CREATE TABLE Users (id STRING PRIMARY KEY, username STRING, url STRING, imageUrl STRING, accessToken STRING);
CREATE TABLE FollowerCount (
  id STRING PRIMARY KEY, userId STRING, number INTEGER, createdAt INTEGER,
  CONSTRAINT FollowerCount_fk_userId FOREIGN KEY (userId)
  REFERENCES Users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX Users_index_username ON Users (username);
CREATE INDEX FollowerCount_index_userId ON FollowerCount (userId);
CREATE INDEX FollowerCount_index_createdAt ON FollowerCount(createdAt)

-- Down
DROP TABLE Users;
DROP TABLE FollowerCount

DROP INDEX Users_index_username;
DROP INDEX FollowerCount_index_userId;
DROP INDEX FollowerCount_index_createdAt;