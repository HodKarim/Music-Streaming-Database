from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    is_admin: bool = False


class UserLogin(BaseModel):
    email: str
    password: str


class ArtistCreate(BaseModel):
    name: str


class ArtistUpdate(BaseModel):
    name: str


class AlbumCreate(BaseModel):
    title: str
    artist_id: int


class AlbumUpdate(BaseModel):
    title: str
    artist_id: int


class SongCreate(BaseModel):
    title: str
    duration: int
    genre: str
    album_id: int
    artist_id: int


class SongUpdate(BaseModel):
    title: str
    duration: int
    genre: str
    album_id: int
    artist_id: int


class PlaylistCreate(BaseModel):
    user_id: int
    name: str


class PlaylistUpdate(BaseModel):
    name: str
