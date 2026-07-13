import type { Request, Response } from "express";
import * as manager from "../lib/tournamentManager.js";

export const createTournamentEndpoint = (req: Request, res: Response) => {
    const { name, type, timeControl, roundsOrDuration } = req.body;
    if (!name || !type || !timeControl || !roundsOrDuration) {
        return res.status(400).json({ message: "Missing required tournament fields." });
    }

    try {
        const tournament = manager.createTournament(
            name,
            type,
            timeControl,
            Number(roundsOrDuration)
        );
        res.status(201).json(tournament);
    } catch (e) {
        res.status(500).json({ message: "Failed to create tournament." });
    }
};

export const joinTournamentEndpoint = (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.session.user;

    if (!user || !user.id || !user.name) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    try {
        const success = manager.joinTournament(id, user.id, user.name);
        if (success) {
            res.status(200).json({ message: "Successfully joined tournament lobby." });
        } else {
            res.status(400).json({ message: "Failed to join tournament or tournament already active." });
        }
    } catch (e) {
        res.status(500).json({ message: "Internal server error joining tournament." });
    }
};

export const startTournamentEndpoint = (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const success = manager.startTournament(id);
        if (success) {
            res.status(200).json({ message: "Tournament started successfully." });
        } else {
            res.status(400).json({ message: "Failed to start tournament." });
        }
    } catch (e) {
        res.status(500).json({ message: "Internal server error starting tournament." });
    }
};

export const getTournamentStatusEndpoint = (req: Request, res: Response) => {
    const { id } = req.params;
    const t = manager.activeTournaments.get(id);
    if (!t) {
        return res.status(404).json({ message: "Tournament not found." });
    }

    const participantsList = Array.from(t.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isWaiting: p.isWaiting
    }));

    res.status(200).json({
        id: t.id,
        name: t.name,
        type: t.type,
        status: t.status,
        timeControl: t.timeControl,
        currentRound: t.currentRound,
        roundsTotal: t.roundsTotal,
        participants: participantsList,
        matchesCount: t.matches.length
    });
};
