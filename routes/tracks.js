const express = require('express');
const router = express.Router();

const {
    fetchAllTracks,
    fetchTrackById,
    createNewTrack,
    updateExistingTrack,
    deleteExistingTrack
} = require('../controllers/tracks.controller');

router.get('/', fetchAllTracks);
router.get('/:id', fetchTrackById);
router.post('/', createNewTrack);
router.patch('/:id', updateExistingTrack);
router.delete('/:id', deleteExistingTrack);

module.exports = router;
