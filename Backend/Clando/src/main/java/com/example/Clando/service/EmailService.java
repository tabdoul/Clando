package com.example.Clando.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void envoyerCodeReset(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("WayVo — Réinitialisation de votre mot de passe");
        message.setText(
            "Bonjour,\n\n" +
            "Vous avez demandé la réinitialisation de votre mot de passe WayVo.\n\n" +
            "Votre code de vérification est : " + code + "\n\n" +
            "Ce code est valable 15 minutes.\n\n" +
            "Si vous n'avez pas fait cette demande, ignorez ce message.\n\n" +
            "L'équipe WayVo"
        );
        mailSender.send(message);
    }
}