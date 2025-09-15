import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  //chatGPT
  const filter = {};

  // Optional search query on title or description
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // Optional filter by userId (if present)
  if (userId) {
    filter.owner = userId; // Assuming 'owner' field in video schema refers to user
  }

  // Sorting
  const sortOption = {};
  sortOption[sortBy] = sortType === "asc" ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  const total = await Video.countDocuments(filter);

  const videos = await Video.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));

  res.json(
    new ApiResponse(200, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      videos,
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title && !description) {
    throw new ApiError(400, "title and description are required");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath && !thumbnailLocalPath) {
    throw new ApiError(400, "video and thumbnailLocalPath is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile && !thumbnail) {
    throw new ApiError(400, "video and thumbnail File is required");
  }

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    owner: req.user?._id,
    videoFile: videoFile.url,
    duration: videoFile.duration,
  });

  if (!video) {
    throw new ApiError(401, "Somrthing went wrong while uploading the video");
  }

  res.json(
    new ApiResponse(200, video, "Video and all details uploaded successfully")
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "fullName avater"
  );

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  res.json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }

  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError("Avater file is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError("Error while updating on thumbnail");
  }

  if ([title, description].some((val) => val?.trim() === "")) {
    throw new ApiError(400, "All Fields are required");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  return res.json(
    new ApiResponse(200, video, "video details updated Successfully")
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  await Video.findByIdAndDelete(videoId);

  res.json(new ApiResponse(200, {}, "video delete successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video is incorrect");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res.json(new ApiResponse(200, video, "Publish Status toggle  successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
