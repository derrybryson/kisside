drop table if exists users;
create table users
(
  userid integer primary key autoincrement,
  username varchar(30) not null,
  password char(60) not null,
  admin integer not null default 0,
  config text not null default '{}',

  unique (username)
);

drop table if exists auths;
create table auths
(
  auth_token char(64) primary key not null,
  userid integer not null,
  expdate integer not null
);

drop table if exists options;
create table options
(
  name text primary key not null,
  value text not null
);