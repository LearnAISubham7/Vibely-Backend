import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { populate } from "dotenv";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if (!name) {
    throw new ApiError(400, "name is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "Playlist is not created properly");
  }

  res.json(new ApiResponse(200, playlist, "Playlist is created Successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  //TODO: get user playlists
  const filter = {};
  if (userId) {
    filter.owner = userId; // Assuming 'owner' field in video schema refers to user
  }

  const total = await Playlist.countDocuments(filter);

  const playlists = await Playlist.find(filter)
    .populate("owner", "fullName avater")
    .populate({
      path: "videos",
      select: "title thumbnail description duration createdAt owner",
      populate: {
        path: "owner",
        select: "fullName",
      },
    })
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, {
      total,
      playlists,
    })
  );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!playlistId) {
    throw new ApiError(400, "playlistId is required");
  }

  const playlist = await Playlist.findById(playlistId)
    .populate("owner", "fullName avater")
    .populate({
      path: "videos",
      select: "title thumbnail description duration createdAt owner",
      populate: {
        path: "owner",
        select: "fullName",
      },
    })
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, playlist, "Playlist is fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoIds } = req.body;

  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    throw new ApiError(400, "videoIds must be a non-empty array");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: { $each: videoIds } },
    },
    {
      new: true,
    }
  );

  res.json(new ApiResponse(200, playlist, "video add successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  res.json(new ApiResponse(200, playlist, "video add successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  await Playlist.findByIdAndDelete(playlistId);
  res.json(new ApiResponse(200, {}, "playlist delete successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  )
    .populate("owner", "fullName avater")
    .populate({
      path: "videos",
      select: "title thumbnail description duration createdAt owner",
      populate: {
        path: "owner",
        select: "fullName",
      },
    })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, playlist, "Playlist update successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
