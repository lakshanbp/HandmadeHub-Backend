const ArtisanRequest = require('../models/ArtisanRequest');
const User = require('../models/User');

// Get all artisan requests (admin only)
exports.getAllArtisanRequests = async (req, res, next) => {
  try {
    const requests = await ArtisanRequest.find().populate('user', 'name email');
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// Approve or reject artisan request (admin only)
exports.handleArtisanRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const request = await ArtisanRequest.findById(req.params.requestId).populate('user');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();

    const user = await User.findById(request.user._id);
    if (status === 'approved') {
      user.role = 'artisan';
      user.artisanStatus = 'approved';
    } else {
      user.artisanStatus = 'rejected';
    }
    await user.save();

    res.json({ message: `Artisan request ${status}`, request });
  } catch (error) {
    next(error);
  }
};

// Delete artisan request (admin only)
exports.deleteArtisanRequest = async (req, res, next) => {
  try {
    const request = await ArtisanRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const user = await User.findById(request.user);
    if (user) {
      user.artisanStatus = 'none';
      await user.save();
    }

    await ArtisanRequest.deleteOne({ _id: req.params.requestId });
    res.json({ message: 'Artisan request deleted' });
  } catch (error) {
    next(error);
  }
};

// Create or update an artisan request
exports.createArtisanRequest = async (req, res, next) => {
  try {
    const { brandName, bio, portfolioLink } = req.body;
    const existingRequest = await ArtisanRequest.findOne({ user: req.user.id });

    if (existingRequest) {
      // Update existing request
      existingRequest.brandName = brandName;
      existingRequest.bio = bio;
      existingRequest.portfolioLink = portfolioLink;
      existingRequest.status = 'pending'; // Resubmit as pending
      await existingRequest.save();
      return res.json(existingRequest);
    }

    // Create new request
    const newRequest = new ArtisanRequest({
      user: req.user.id,
      brandName,
      bio,
      portfolioLink,
    });
    await newRequest.save();
    
    // Update user's artisan status
    const user = await User.findById(req.user.id);
    user.artisanStatus = 'pending';
    await user.save();
    
    res.status(201).json(newRequest);
  } catch (error) {
    next(error);
  }
};

// Get the current user's artisan request
exports.getMyArtisanRequest = async (req, res, next) => {
  try {
    const request = await ArtisanRequest.findOne({ user: req.user.id });
    if (!request) {
      return res.status(404).json({ message: 'No artisan request found.' });
    }
    res.json(request);
  } catch (error) {
    next(error);
  }
};