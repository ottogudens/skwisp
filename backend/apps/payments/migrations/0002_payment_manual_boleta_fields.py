from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='mp_payment_type',
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AddField(
            model_name='payment',
            name='requires_manual_boleta',
            field=models.BooleanField(
                default=False,
                help_text='True si el pago fue por transferencia y no está cubierto por '
                          'el voucher-válido-como-boleta de Mercado Pago (solo aplica a '
                          'tarjeta).',
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='manual_boleta_issued',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='payment',
            name='manual_boleta_number',
            field=models.CharField(blank=True, help_text='Folio SII', max_length=50),
        ),
        migrations.AddField(
            model_name='payment',
            name='manual_boleta_issued_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='manual_boleta_issued_by',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='boletas_emitidas',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterModelOptions(
            name='payment',
            options={'ordering': ['-created_at']},
        ),
    ]
